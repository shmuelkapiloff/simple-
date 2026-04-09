import request from "supertest";
import app from "../app";
import { UserModel } from "../models/user.model";

// Mock google-auth-library
jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn(async ({ idToken }: { idToken: string }) => {
        if (idToken === "valid-google-token") {
          return {
            getPayload: () => ({
              email: "googleuser@example.com",
              sub: "google123456",
              name: "Google User",
              picture: "https://lh3.googleusercontent.com/a-/avatar.jpg",
            }),
          };
        }
        if (idToken === "existing-email-token") {
          return {
            getPayload: () => ({
              email: "existing@example.com",
              sub: "google999999",
              name: "Existing User",
              picture: "https://lh3.googleusercontent.com/a-/avatar2.jpg",
            }),
          };
        }
        if (idToken === "inactive-token") {
          return {
            getPayload: () => ({
              email: "inactive@example.com",
              sub: "googleInactive",
              name: "Inactive User",
              picture: "https://lh3.googleusercontent.com/a-/avatar3.jpg",
            }),
          };
        }
        // Simulate invalid token
        return { getPayload: () => null };
      }),
    })),
  };
});

describe("Auth Routes - Google OAuth", () => {
  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  it("should create a new user with Google token", async () => {
    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "valid-google-token" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("googleuser@example.com");
    expect(res.body.data.user.googleId).toBe("google123456");
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // DB check
    const user = await UserModel.findOne({ email: "googleuser@example.com" });
    expect(user).not.toBeNull();
    expect(user!.googleId).toBe("google123456");
  });

  it("should link Google account to existing user by email", async () => {
    await UserModel.create({
      email: "existing@example.com",
      name: "Existing User",
      password: "irrelevant",
      isActive: true,
    });
    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "existing-email-token" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("existing@example.com");
    expect(res.body.data.user.googleId).toBe("google999999");
    // DB check
    const user = await UserModel.findOne({ email: "existing@example.com" });
    expect(user!.googleId).toBe("google999999");
  });

  it("should not allow login for inactive user", async () => {
    await UserModel.create({
      email: "inactive@example.com",
      name: "Inactive User",
      password: "irrelevant",
      isActive: false,
    });
    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "inactive-token" });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/blocked|inactive/i);
  });

  it("should return 400 for missing idToken", async () => {
    const res = await request(app)
      .post("/api/auth/google")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid Google token", async () => {
    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "invalid-token" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
