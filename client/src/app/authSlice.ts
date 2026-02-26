import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// API Base URL from env
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  authModalView: "login" | "register";
  authPromptMessage: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("accessToken"), // ⚠️ Access token only (15 min)
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  showAuthModal: false,
  authModalView: "login",
  authPromptMessage: null,
};

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      // Check if response has content
      const text = await response.text();
      if (!text) {
        return rejectWithValue("שרת לא זמין. אנא וודא שהשרת רץ.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        return rejectWithValue("תגובה לא תקינה מהשרת");
      }

      if (!response.ok) {
        return rejectWithValue(data.message || "Login failed");
      }

      // Store tokens
      const accessToken = data?.data?.token;
      const refreshToken = data?.data?.refreshToken;

      if (accessToken) {
        // ⚠️ Access token (15 min): Short-lived, safe in localStorage
        localStorage.setItem("accessToken", accessToken);
      }
      if (refreshToken) {
        // ⚠️ Refresh token (7 days): Store in sessionStorage for extra security
        // sessionStorage is cleared when browser closes, good for refresh tokens
        sessionStorage.setItem("refreshToken", refreshToken);
      }

      return data;
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue("לא ניתן להתחבר לשרת. בדוק שהשרת פעיל.");
      }
      return rejectWithValue(error.message || "שגיאת רשת");
    }
  },
);

export const register = createAsyncThunk<AuthResponse, RegisterData>(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Check if response has content
      const text = await response.text();
      if (!text) {
        return rejectWithValue("שרת לא זמין. אנא וודא שהשרת רץ.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        return rejectWithValue("תגובה לא תקינה מהשרת");
      }

      if (!response.ok) {
        return rejectWithValue(data.message || "Registration failed");
      }

      // Store tokens
      const accessToken = data?.data?.token;
      const refreshToken = data?.data?.refreshToken;

      if (accessToken) {
        // ⚠️ Access token (15 min): Short-lived, safe in localStorage
        localStorage.setItem("accessToken", accessToken);
      }
      if (refreshToken) {
        // ⚠️ Refresh token (7 days): Store in sessionStorage for extra security
        sessionStorage.setItem("refreshToken", refreshToken);
      }

      return data;
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue("לא ניתן להתחבר לשרת. בדוק שהשרת פעיל.");
      }
      return rejectWithValue(error.message || "שגיאת רשת");
    }
  },
);

export const verifyToken = createAsyncThunk<User>(
  "auth/verifyToken",
  async (_, { rejectWithValue, getState }) => {
    try {
      console.log("🔍 verifyToken: Starting verification...");

      const state = getState() as { auth: AuthState };
      const tokenFromState = state.auth.token;
      const tokenFromStorage = localStorage.getItem("accessToken"); // ⚠️ Use accessToken

      console.log("🔍 verifyToken: Token sources:", {
        fromState: tokenFromState ? "exists" : "missing",
        fromStorage: tokenFromStorage ? "exists" : "missing",
      });

      // Use token from localStorage if state token is missing
      const token = tokenFromState || tokenFromStorage;

      if (!token) {
        console.log("❌ verifyToken: No token found anywhere");
        return rejectWithValue("No token found");
      }

      console.log("🚀 verifyToken: Making API call...");
      const response = await fetch(`${API_BASE_URL}auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 verifyToken: Response status:", response.status);

      // Check if response has content
      const text = await response.text();
      if (!text) {
        console.log("❌ verifyToken: Empty response");
        return rejectWithValue("שרת לא זמין");
      }

      let data;
      try {
        data = JSON.parse(text);
        console.log("✅ verifyToken: Parsed response:", {
          success: data.success,
          userExists: !!data?.data?.user,
        });
      } catch (jsonError) {
        console.log("❌ verifyToken: JSON parse error:", jsonError);
        return rejectWithValue("תגובה לא תקינה מהשרת");
      }

      if (!response.ok) {
        console.log("❌ verifyToken: Server error:", data.message);
        return rejectWithValue(data.message || "Token verification failed");
      }

      const user = data?.data?.user;
      console.log("🎉 verifyToken: Success! User:", user?.name);
      return user;
    } catch (error: any) {
      console.log("❌ verifyToken: Network error:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue("שרת לא זמין - מעבר למצב offline");
      }
      return rejectWithValue(error.message || "שגיאת רשת");
    }
  },
);

export const logout = createAsyncThunk<void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        // Optional: Call logout endpoint to invalidate token on server
        await fetch(`${API_BASE_URL}auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }

      // Remove tokens from storage
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
    } catch (error: any) {
      // Even if server logout fails, we still want to clear local state
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      return rejectWithValue(error.message || "Logout failed");
    }
  },
);

/**
 * 🔄 Refresh Access Token
 * ────────────────────────
 * Called automatically when access token expires (15 min)
 * Uses long-lived refresh token (7 days) to get new short-lived access token
 *
 * Use case: User is active but access token expired
 * Result: Seamless experience - no logout required
 */
export const refreshAccessToken = createAsyncThunk<
  { token: string; refreshToken: string },
  void,
  { rejectValue: string }
>("auth/refreshAccessToken", async (_, { rejectWithValue }) => {
  try {
    const refreshToken = sessionStorage.getItem("refreshToken");

    if (!refreshToken) {
      return rejectWithValue("No refresh token available");
    }

    const response = await fetch(`${API_BASE_URL}auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const text = await response.text();
    if (!text) {
      return rejectWithValue("Server not available");
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      return rejectWithValue("Invalid response from server");
    }

    if (!response.ok) {
      return rejectWithValue(data.message || "Failed to refresh token");
    }

    const newAccessToken = data?.data?.token;
    const newRefreshToken = data?.data?.refreshToken;

    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
    }

    // Refresh token can also be rotated (for extra security)
    if (newRefreshToken) {
      sessionStorage.setItem("refreshToken", newRefreshToken);
    }

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken || refreshToken,
    };
  } catch (error: any) {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    return rejectWithValue(error.message || "Failed to refresh token");
  }
});

interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
}

export const updateProfile = createAsyncThunk<
  { user: User; message: string },
  UpdateProfileData
>("auth/updateProfile", async (profileData, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Profile update failed");
    }

    return { user: data.data.user, message: data.message };
  } catch (error: any) {
    return rejectWithValue(error.message || "Profile update failed");
  }
});

export const changePassword = createAsyncThunk<
  { message: string },
  ChangePasswordCredentials
>("auth/changePassword", async (credentials, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: credentials.currentPassword,
        newPassword: credentials.newPassword,
        confirmPassword: credentials.confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Change password failed");
    }

    return data.data || data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Change password failed");
  }
});

export const forgotPassword = createAsyncThunk<
  { message: string; resetToken?: string },
  string
>("auth/forgotPassword", async (email, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Failed to send reset email");
    }

    return data.data || data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to send reset email");
  }
});

interface ResetPasswordCredentials {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const resetPassword = createAsyncThunk<
  { message: string },
  ResetPasswordCredentials
>("auth/resetPassword", async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}auth/reset-password/${credentials.token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: credentials.newPassword,
          confirmPassword: credentials.confirmPassword,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Failed to reset password");
    }

    return data.data || data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to reset password");
  }
});
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    requireAuth: (
      state,
      action: PayloadAction<{ view?: "login" | "register"; message?: string }>,
    ) => {
      state.showAuthModal = true;
      state.authModalView = action.payload.view || "login";
      state.authPromptMessage = action.payload.message || null;
    },
    openAuthModal: (
      state,
      action: PayloadAction<"login" | "register" | undefined>,
    ) => {
      state.showAuthModal = true;
      state.authModalView = action.payload || "login";
    },
    closeAuthModal: (state) => {
      state.showAuthModal = false;
      state.authPromptMessage = null;
    },
    setAuthModalView: (state, action: PayloadAction<"login" | "register">) => {
      state.authModalView = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("🎉 login.fulfilled - Setting user and token:", {
          user: action.payload.data?.user?.name,
          tokenExists: !!action.payload.data?.token,
          fullPayload: action.payload,
        });
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
        state.showAuthModal = false;
        state.authPromptMessage = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
        state.showAuthModal = false;
        state.authPromptMessage = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Verify Token
    builder
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        // Make sure token is in state from localStorage
        const token = localStorage.getItem("accessToken");
        if (token) {
          state.token = token;
        }
      })
      .addCase(verifyToken.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null; // Don't show error for failed token verification
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.showAuthModal = false;
        state.authPromptMessage = null;
        state.authModalView = "login";
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Still clear state even if logout request failed
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.showAuthModal = false;
        state.authPromptMessage = null;
        state.authModalView = "login";
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      });

    // Refresh Access Token
    builder
      .addCase(refreshAccessToken.pending, (state) => {
        // Don't set loading - this happens in background
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        // Update token in state
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // Token refresh failed - logout user
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to change password";

        // Update Profile
        builder
          .addCase(updateProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
          })
          .addCase(updateProfile.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            // Update user in state with new data
            if (state.user) {
              state.user = { ...state.user, ...action.payload.user };
            }
          })
          .addCase(updateProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
              (action.payload as string) || "Failed to update profile";
          });
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) || "Failed to send reset email";
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to reset password";
      });
  },
});

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectShowAuthModal = (state: { auth: AuthState }) =>
  state.auth.showAuthModal;
export const selectAuthModalView = (state: { auth: AuthState }) =>
  state.auth.authModalView;
export const selectAuthPromptMessage = (state: { auth: AuthState }) =>
  state.auth.authPromptMessage;

// Actions
export const {
  clearError,
  setLoading,
  requireAuth,
  openAuthModal,
  closeAuthModal,
  setAuthModalView,
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;
