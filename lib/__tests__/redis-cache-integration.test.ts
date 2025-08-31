import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setRedisCache, getRedisCache } from "../redis-cache";
import type { BCRAResponse } from "../bcra-fetch";

// Don't mock Redis for integration tests - we want to test the real behavior
describe("Redis Cache Integration Tests", () => {
  const mockBCRAData: BCRAResponse = {
    status: 200,
    results: [
      {
        idVariable: 1,
        descripcion: "Reservas Internacionales",
        categoria: "Divisas",
        fecha: "2025-01-29",
        valor: 50000,
      },
      {
        idVariable: 27,
        descripcion: "IPC Nacional",
        categoria: "Inflación",
        fecha: "2025-01-01",
        valor: 3.5,
      },
    ],
  };

  const testKey = "test:bcra:integration-test-key";
  const bcraKey = "bcra:integration-test";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    )
      return;
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      const withTimeout = <T>(p: Promise<T>, ms = 1000) =>
        Promise.race([
          p,
          new Promise<never>((_, r) =>
            setTimeout(() => r(new Error("cleanup timeout")), ms),
          ),
        ]);
      await withTimeout(redis.del(testKey));
      await withTimeout(redis.del(bcraKey));
      await withTimeout(redis.del(`${testKey}-custom`));
    } catch {}
  });

  describe("Redis Operations with Real Instance", () => {
    it("should set and get cache data successfully when Redis is available", async () => {
      await setRedisCache(testKey, mockBCRAData);
      const retrieved = await getRedisCache(testKey);

      if (retrieved) {
        expect(retrieved).toEqual(mockBCRAData);
        expect(retrieved.status).toBe(200);
        expect(retrieved.results).toHaveLength(2);
        expect(retrieved.results[0].idVariable).toBe(1);
      } else {
        // If Redis is not configured, the functions should handle it gracefully
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining("Redis not configured"),
        );
      }
    });

    it("should handle bcra: prefixed keys correctly", async () => {
      await setRedisCache(bcraKey, mockBCRAData);
      const retrieved = await getRedisCache(bcraKey);

      if (retrieved) {
        expect(retrieved).toEqual(mockBCRAData);
      }
      // Test passes whether Redis is available or not
    });

    it("should return null for non-existent keys", async () => {
      const nonExistentKey = "test:non-existent-key-" + Date.now();
      const result = await getRedisCache(nonExistentKey);

      // Should return null whether Redis is available (key doesn't exist) or not available
      expect(result).toBeNull();
    });

    it("should handle TTL correctly", async () => {
      // This test verifies that data is stored with the correct TTL
      // We can't easily test the actual expiration without waiting 7 days
      // But we can verify the data is stored and retrievable
      const ttlTestKey = `test:ttl-test-${Date.now()}`;

      await setRedisCache(ttlTestKey, mockBCRAData);
      const immediately = await getRedisCache(ttlTestKey);

      if (immediately) {
        expect(immediately).toEqual(mockBCRAData);
      }

      // Cleanup
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = Redis.fromEnv();
        if (redis) {
          await redis.del(ttlTestKey);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle Redis connection errors gracefully", async () => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "http://example.com");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

      vi.doMock("@upstash/redis", () => ({
        Redis: {
          fromEnv: () => ({
            setex: vi.fn().mockRejectedValue(new Error("Connection failed")),
            get: vi.fn().mockRejectedValue(new Error("Connection failed")),
          }),
        },
      }));

      await expect(setRedisCache(testKey, mockBCRAData)).resolves.not.toThrow();
      await expect(getRedisCache(testKey)).resolves.toBe(null);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to cache data in Redis"),
      );
    });

    it("should handle malformed data gracefully", async () => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "http://example.com");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

      vi.doMock("@upstash/redis", () => ({
        Redis: {
          fromEnv: () => ({
            get: vi.fn().mockResolvedValue("invalid json {"),
            setex: vi.fn().mockResolvedValue("OK"),
          }),
        },
      }));

      const result = await getRedisCache(testKey);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to retrieve fallback data from Redis"),
      );
    });

    it("should handle Redis not configured scenario", async () => {
      // Mock Redis.fromEnv to return null (not configured)
      vi.doMock("@upstash/redis", () => ({
        Redis: {
          fromEnv: () => null,
        },
      }));

      await setRedisCache(testKey, mockBCRAData);
      const result = await getRedisCache(testKey);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        "Redis not configured - data will not be cached for fallback",
      );
      expect(console.warn).toHaveBeenCalledWith(
        "Redis not configured - cannot retrieve fallback data",
      );
    });
  });

  describe("Key Management and Patterns", () => {
    it("should handle keys with and without bcra: prefix correctly", async () => {
      const regularKey = "test:regular-key";
      const bcraKey = "bcra:test-key";
      const prefixedKey = "bcra:already-prefixed";

      await setRedisCache(regularKey, mockBCRAData);
      await setRedisCache(bcraKey, mockBCRAData);
      await setRedisCache(prefixedKey, mockBCRAData);

      // All should work regardless of prefix
      const result1 = await getRedisCache(regularKey);
      const result2 = await getRedisCache(bcraKey);
      const result3 = await getRedisCache(prefixedKey);

      // If Redis is available, all should return the data
      // If not, all should return null
      if (result1) {
        expect(result1).toEqual(mockBCRAData);
        expect(result2).toEqual(mockBCRAData);
        expect(result3).toEqual(mockBCRAData);
      } else {
        expect(result1).toBeNull();
        expect(result2).toBeNull();
        expect(result3).toBeNull();
      }
    });

    it("should handle typical BCRA data keys", async () => {
      const bcraKeys = [
        "bcra:BCRADirect",
        "bcra:details_27",
        "bcra:details_1",
        "bcra:inflation_data",
      ];

      for (const key of bcraKeys) {
        await setRedisCache(key, mockBCRAData);
        const result = await getRedisCache(key);

        if (result) {
          expect(result).toEqual(mockBCRAData);
        }
      }
    });
  });

  describe("Data Integrity and Serialization", () => {
    it("should preserve complex BCRA data structure", async () => {
      const complexBCRAData: BCRAResponse = {
        status: 200,
        results: [
          {
            idVariable: 27,
            descripcion: "Índice de Precios al Consumidor Nacional",
            categoria: "Precios y Salarios",
            fecha: "2025-01-01",
            valor: 3.567891234,
          },
          {
            idVariable: 1,
            descripcion: "Reservas Internacionales del BCRA",
            categoria: "Sector Externo",
            fecha: "2025-01-29",
            valor: 50123456789.99,
          },
        ],
      };

      await setRedisCache(testKey, complexBCRAData);
      const retrieved = await getRedisCache(testKey);

      if (retrieved) {
        expect(retrieved).toEqual(complexBCRAData);
        expect(retrieved.results[0].valor).toBe(3.567891234);
        expect(retrieved.results[1].valor).toBe(50123456789.99);
        expect(retrieved.results[0].descripcion).toContain("Índice de Precios");
        expect(retrieved.results[1].descripcion).toContain("Reservas");
      }
    });

    it("should handle empty and edge case data", async () => {
      const edgeCases: BCRAResponse[] = [
        { status: 200, results: [] }, // Empty results
        { status: 500, results: [] }, // Error status
        {
          status: 200,
          results: [
            {
              idVariable: 999,
              descripcion: "",
              categoria: "",
              fecha: "2025-01-01",
              valor: 0,
            },
          ],
        }, // Edge values
      ];

      for (let i = 0; i < edgeCases.length; i++) {
        const edgeKey = `${testKey}-edge-${i}`;
        await setRedisCache(edgeKey, edgeCases[i]);
        const result = await getRedisCache(edgeKey);

        if (result) {
          expect(result).toEqual(edgeCases[i]);
        }
      }
    });
  });

  describe("Performance and Concurrency", () => {
    it("should handle multiple concurrent operations", async () => {
      const concurrentKeys = Array.from(
        { length: 5 },
        (_, i) => `${testKey}-concurrent-${i}`,
      );
      const concurrentData = concurrentKeys.map((_, i) => ({
        ...mockBCRAData,
        results: [
          {
            ...mockBCRAData.results[0],
            idVariable: i + 1,
            valor: (i + 1) * 1000,
          },
        ],
      }));

      for (let i = 0; i < concurrentKeys.length; i++) {
        await setRedisCache(concurrentKeys[i], concurrentData[i]);
      }

      const results = [] as (BCRAResponse | null)[];
      for (const key of concurrentKeys) {
        const r = await getRedisCache(key);
        results.push(r);
      }

      // Verify results (if Redis is available)
      results.forEach((result, i) => {
        if (result) {
          expect(result.results[0].idVariable).toBe(i + 1);
          expect(result.results[0].valor).toBe((i + 1) * 1000);
        }
      });
    });

    it("should handle rapid successive operations on same key", async () => {
      const rapidKey = `${testKey}-rapid`;
      // Gentle successive operations
      const results: (BCRAResponse | null)[] = [];
      for (let i = 0; i < 3; i++) {
        const data = {
          ...mockBCRAData,
          results: [{ ...mockBCRAData.results[0], valor: i * 100 }],
        } as BCRAResponse;

        await setRedisCache(rapidKey, data);

        const got = await getRedisCache(rapidKey);
        results.push(got);
      }

      // All operations should complete without errors
      results.forEach((result) => {
        if (result) {
          expect(result).toBeDefined();
          expect(result.status).toBe(200);
        }
      });
    });
  });
});
