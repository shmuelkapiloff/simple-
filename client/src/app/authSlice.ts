import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

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
  token: localStorage.getItem("token"),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem("token"),
};

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:4001/api/auth/login", {
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

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue(
          "לא ניתן להתחבר לשרת. אנא וודא שהשרת רץ על http://localhost:4001"
        );
      }
      return rejectWithValue(error.message || "שגיאת רשת");
    }
  }
);

export const register = createAsyncThunk<AuthResponse, RegisterData>(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:4001/api/auth/register", {
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

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue(
          "לא ניתן להתחבר לשרת. אנא וודא שהשרת רץ על http://localhost:4001"
        );
      }
      return rejectWithValue(error.message || "שגיאת רשת");
    }
  }
);

export const verifyToken = createAsyncThunk<User>(
  "auth/verifyToken",
  async (_, { rejectWithValue, getState }) => {
    try {
      console.log("🔍 verifyToken: Starting verification...");

      const state = getState() as { auth: AuthState };
      const tokenFromState = state.auth.token;
      const tokenFromStorage = localStorage.getItem("token");

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
      const response = await fetch("http://localhost:4001/api/auth/verify", {
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
          userExists: !!data.user,
        });
      } catch (jsonError) {
        console.log("❌ verifyToken: JSON parse error:", jsonError);
        return rejectWithValue("תגובה לא תקינה מהשרת");
      }

      if (!response.ok) {
        console.log("❌ verifyToken: Server error:", data.message);
        return rejectWithValue(data.message || "Token verification failed");
      }

      console.log("🎉 verifyToken: Success! User:", data.user?.name);
      return data.user;
    } catch (error: any) {
      console.log("❌ verifyToken: Network error:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue("שרת לא זמין - מעבר למצב offline");
      }
      return rejectWithValue(error.message || "שגיאת רשת");
    }
  }
);

export const logout = createAsyncThunk<void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        // Optional: Call logout endpoint to invalidate token on server
        await fetch("http://localhost:4001/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Remove token from localStorage
      localStorage.removeItem("token");
    } catch (error: any) {
      // Even if server logout fails, we still want to clear local state
      localStorage.removeItem("token");
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

// Slice
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
        const token = localStorage.getItem("token");
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
        localStorage.removeItem("token");
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
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Still clear state even if logout request failed
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
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

// Actions
export const { clearError, setLoading } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
