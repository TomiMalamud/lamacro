import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBCRARequestOptions } from "../bcra-api-helper";
import type { OutgoingHttpHeaders } from "http";

describe("bcra-api-helper.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBCRARequestOptions", () => {
    it("should create request options with correct headers", () => {
      const options = createBCRARequestOptions("/test/path");
      const headers = options.headers as OutgoingHttpHeaders;

      expect(options.hostname).toBe("api.bcra.gob.ar");
      expect(options.path).toBe("/test/path");
      expect(options.method).toBe("GET");
      expect(headers).toBeDefined();
      expect(headers["User-Agent"]).toContain("Mozilla");
      expect(headers["Accept"]).toBe("application/json, text/plain, */*");
      expect(headers["X-Forwarded-For"]).toBe("190.191.237.1");
      expect(headers["CF-IPCountry"]).toBe("AR");
      expect(options.timeout).toBe(10000);
      expect(options.rejectUnauthorized).toBe(false);
    });

    it("should use environment URL for Origin and Referer", () => {
      const originalEnv = process.env.VERCEL_URL;
      process.env.VERCEL_URL = "test.vercel.app";

      const options = createBCRARequestOptions("/test");
      const headers = options.headers as OutgoingHttpHeaders;

      expect(headers["Origin"]).toBe("https://test.vercel.app");
      expect(headers["Referer"]).toBe("https://test.vercel.app");

      process.env.VERCEL_URL = originalEnv;
    });

    it("should include all required headers", () => {
      const options = createBCRARequestOptions("/estadisticas/v3.0/monetarias");
      const headers = options.headers as OutgoingHttpHeaders;

      expect(headers["Accept-Language"]).toBe("es-AR,es;q=0.9,en;q=0.8");
      expect(headers["Connection"]).toBe("keep-alive");
      expect(headers["Host"]).toBe("api.bcra.gob.ar");
      expect(headers["Content-Language"]).toBe("es-AR");
      expect(headers["Sec-Fetch-Dest"]).toBe("empty");
      expect(headers["Sec-Fetch-Mode"]).toBe("cors");
      expect(headers["Sec-Fetch-Site"]).toBe("cross-site");
    });
  });
});
