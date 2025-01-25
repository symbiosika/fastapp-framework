import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import { definePublicUserRoutes } from "./public";
import { defineSecuredUserRoutes } from "./protected";
import type { FastAppHono } from "../../types";
import { initTests } from "../../test/init.test";

describe("User API Endpoints", () => {
  const app: FastAppHono = new Hono();
  let jwt: string;
  let password: string;

  beforeAll(async () => {
    const { token, password: initPassword } = await initTests();
    jwt = token;
    password = initPassword;
    defineSecuredUserRoutes(app, "/api");
    definePublicUserRoutes(app, "/api");
  });

  // Test user authentication
  it("should login with valid credentials", async () => {
    const loginData = {
      email: "admin@symbiosika.com",
      password,
    };

    const response = await app.request("/api/user/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
  });

  // Test user profile retrieval
  it("should get user profile", async () => {
    const response = await app.request("/api/user/me", {
      method: "GET",
      headers: {
        Cookie: `jwt=${jwt}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userId).toBeDefined();
    expect(data.email).toBeDefined();
  });

  // Test user profile update
  it("should update user profile", async () => {
    const updateData = {
      firstname: "John",
      surname: "Doe",
      image: "profile.jpg",
    };

    const response = await app.request("/api/user/me", {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: {
        Cookie: `jwt=${jwt}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].firstname).toBe("John");
    expect(data[0].surname).toBe("Doe");
  });

  // Test user search
  it("should search for user by email", async () => {
    const response = await app.request(
      "/api/user/search?email=admin@symbiosika.com",
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.email).toBe("admin@symbiosika.com");
  });

  // Test user registration
  it("should register new user", async () => {
    const registerData = {
      email: "newuser@example.com",
      password: "newpassword",
      sendVerificationEmail: false,
    };

    const response = await app.request("/api/user/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });

  // Test error cases
  it("should handle invalid requests", async () => {
    // Test invalid login
    const invalidLoginResponse = await app.request("/api/user/login", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid@example.com",
        password: "wrongpassword",
      }),
    });
    expect(invalidLoginResponse.status).toBe(401);

    // Test search without email
    const invalidSearchResponse = await app.request("/api/user/search", {
      method: "GET",
      headers: {
        Cookie: `jwt=${jwt}`,
      },
    });
    expect(invalidSearchResponse.status).toBe(400);

    // Test unauthorized access
    const unauthorizedResponse = await app.request("/api/user/me", {
      method: "GET",
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
