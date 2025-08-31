import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTamarCallValueAction,
  getTamarCallValueData,
} from "../tamar-actions";
import type { CallValueRequest, CallValueResponse } from "../duales";

// Mock fetch globally
global.fetch = vi.fn();

describe("TAMAR Actions Integration Tests", () => {
  const mockRequest: CallValueRequest = {
    target_mean: 150.5,
    target_prob: 0.85,
    threshold: 125.0,
    min_val: 100.0,
  };

  const mockSuccessResponse: CallValueResponse = {
    call_value_b100: 45.75,
    distribution_data: [
      {
        TAMAR_DIC_26_pct: 120.0,
        TAMAR_MEAN: 145.5,
        fixed_amort_b100: 42.5,
        proba_pct: 0.8,
        tamar_amort_b100: 47.2,
        tamar_diff_b100: 4.7,
      },
      {
        TAMAR_DIC_26_pct: 130.0,
        TAMAR_MEAN: 155.2,
        fixed_amort_b100: 44.1,
        proba_pct: 0.9,
        tamar_amort_b100: 49.8,
        tamar_diff_b100: 5.7,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    // Set up default API key
    process.env.BACKEND_API_KEY = "test-api-key-12345";
  });

  afterEach(() => {
    delete process.env.BACKEND_API_KEY;
  });

  describe("getTamarCallValueAction", () => {
    it("should successfully call TAMAR API and return data", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual(mockSuccessResponse);
      expect(fetch).toHaveBeenCalledWith(
        "https://tmalamud.pythonanywhere.com/api/tamar-calculation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-api-key-12345",
          },
          body: JSON.stringify(mockRequest),
          next: { revalidate: 3600 },
        },
      );
    });

    it("should return error when API key is missing", async () => {
      delete process.env.BACKEND_API_KEY;

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error: "Server configuration error: API key missing.",
      });
      expect(console.error).toHaveBeenCalledWith(
        "TAMAR API key (BACKEND_API_KEY) not configured on the server.",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle API errors correctly", async () => {
      const mockErrorResponse = "Invalid request parameters";
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: vi.fn().mockResolvedValue(mockErrorResponse),
      } as unknown as Response);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error:
          "API request failed: 400 Bad Request. Invalid request parameters",
      });
      expect(console.error).toHaveBeenCalledWith(
        "API request failed: 400 Bad Request",
        mockErrorResponse,
      );
    });

    it("should handle unauthorized access (401)", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: vi.fn().mockResolvedValue("Invalid API key"),
      } as unknown as Response);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error: "API request failed: 401 Unauthorized. Invalid API key",
      });
    });

    it("should handle server errors (500)", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: vi.fn().mockResolvedValue("Server maintenance"),
      } as unknown as Response);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error:
          "API request failed: 500 Internal Server Error. Server maintenance",
      });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Failed to fetch");
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error: "Network or unexpected error: Failed to fetch",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching call value in server action:",
        networkError,
      );
    });

    it("should handle timeout errors", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error: "Network or unexpected error: Request timeout",
      });
    });

    it("should handle non-Error exceptions", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce("String error");

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error: "An unknown error occurred while fetching call value.",
      });
    });

    it("should handle malformed JSON responses", async () => {
      const mockFetch = vi.mocked(fetch);
      const jsonMock = vi.fn();
      jsonMock.mockRejectedValue(new Error("Invalid JSON"));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: jsonMock,
      } as unknown as Response);

      const result = await getTamarCallValueAction(mockRequest);

      expect(result).toEqual({
        error: "Network or unexpected error: Invalid JSON",
      });
    });
  });

  describe("getTamarCallValueData", () => {
    it("should successfully fetch data with cache strategy", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      const result = await getTamarCallValueData(mockRequest);

      expect(result).toEqual(mockSuccessResponse);
      expect(fetch).toHaveBeenCalledWith(
        "https://tmalamud.pythonanywhere.com/api/tamar-calculation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-api-key-12345",
          },
          body: JSON.stringify(mockRequest),
          cache: "force-cache",
        },
      );
    });

    it("should return null when API key is missing", async () => {
      delete process.env.BACKEND_API_KEY;

      const result = await getTamarCallValueData(mockRequest);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "TAMAR API key (BACKEND_API_KEY) not configured on the server.",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should return null on API errors", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as unknown as Response);

      const result = await getTamarCallValueData(mockRequest);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "API request failed: 404 Not Found",
      );
    });

    it("should return null on network errors", async () => {
      const networkError = new Error("Connection refused");
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await getTamarCallValueData(mockRequest);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching call value data:",
        networkError,
      );
    });

    it("should handle different request parameters", async () => {
      const customRequest: CallValueRequest = {
        target_mean: 200.0,
        target_prob: 0.95,
        threshold: 180.0,
        min_val: 150.0,
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      const result = await getTamarCallValueData(customRequest);

      expect(result).toEqual(mockSuccessResponse);
      expect(fetch).toHaveBeenCalledWith(
        "https://tmalamud.pythonanywhere.com/api/tamar-calculation",
        expect.objectContaining({
          body: JSON.stringify(customRequest),
        }),
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle rapid successive calls correctly", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSuccessResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSuccessResponse),
        } as unknown as Response);

      const [result1, result2] = await Promise.all([
        getTamarCallValueAction(mockRequest),
        getTamarCallValueData(mockRequest),
      ]);

      expect(result1).toEqual(mockSuccessResponse);
      expect(result2).toEqual(mockSuccessResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("should use different caching strategies between functions", () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      // Call both functions to verify different caching strategies
      getTamarCallValueAction(mockRequest);
      getTamarCallValueData(mockRequest);

      // Verify the different cache strategies were used
      const calls = mockFetch.mock.calls;
      expect(calls[0][1]).toHaveProperty("next", { revalidate: 3600 });
      expect(calls[1][1]).toHaveProperty("cache", "force-cache");
    });

    it("should handle API key validation consistently", async () => {
      process.env.BACKEND_API_KEY = "valid-key-789";

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      await getTamarCallValueAction(mockRequest);
      await getTamarCallValueData(mockRequest);

      // Both calls should use the same API key
      const calls = mockFetch.mock.calls;
      expect(calls[0][1]?.headers).toHaveProperty("x-api-key", "valid-key-789");
      expect(calls[1][1]?.headers).toHaveProperty("x-api-key", "valid-key-789");
    });

    it("should handle edge case request parameters", async () => {
      const edgeRequest: CallValueRequest = {
        target_mean: 0,
        target_prob: 1.0,
        threshold: -50,
        min_val: -100,
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      const result = await getTamarCallValueAction(edgeRequest);

      expect(result).toEqual(mockSuccessResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(edgeRequest),
        }),
      );
    });
  });
});
