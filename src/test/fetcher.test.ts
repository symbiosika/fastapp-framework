import type { FastAppHono } from "../types";

export const testFetcher = {
  get: async (app: FastAppHono, path: string, token: string) => {
    const response = await app.request(path, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },

  post: async (app: FastAppHono, path: string, token: string, body: any) => {
    const response = await app.request(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return response;
  },

  put: async (app: FastAppHono, path: string, token: string, body: any) => {
    const response = await app.request(path, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return response;
  },

  delete: async (app: FastAppHono, path: string, token: string) => {
    const response = await app.request(path, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },
};
