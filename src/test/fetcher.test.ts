import type { FastAppHono } from "../types";

export const testFetcher = {
  get: async (
    app: FastAppHono,
    path: string,
    token: string
  ): Promise<{
    status: number;
    jsonResponse: any | undefined;
    textResponse: string;
  }> => {
    const response = await app.request(path, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const textResponse = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(textResponse);
    } catch (error) {
      // jsonResponse remains undefined if parsing fails
    }
    return { status: response.status, jsonResponse, textResponse };
  },

  post: async (
    app: FastAppHono,
    path: string,
    token: string,
    body: any
  ): Promise<{
    status: number;
    jsonResponse: any | undefined;
    textResponse: string;
  }> => {
    const response = await app.request(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const textResponse = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(textResponse);
    } catch (error) {
      // jsonResponse remains undefined if parsing fails
    }
    return { status: response.status, jsonResponse, textResponse };
  },

  put: async (
    app: FastAppHono,
    path: string,
    token: string,
    body: any
  ): Promise<{
    status: number;
    jsonResponse: any | undefined;
    textResponse: string;
  }> => {
    const response = await app.request(path, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const textResponse = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(textResponse);
    } catch (error) {
      // jsonResponse remains undefined if parsing fails
    }
    return { status: response.status, jsonResponse, textResponse };
  },

  delete: async (
    app: FastAppHono,
    path: string,
    token: string
  ): Promise<{
    status: number;
    jsonResponse: any | undefined;
    textResponse: string;
  }> => {
    const response = await app.request(path, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const textResponse = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(textResponse);
    } catch (error) {
      // jsonResponse remains undefined if parsing fails
    }
    return { status: response.status, jsonResponse, textResponse };
  },
};
