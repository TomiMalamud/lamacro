import { describe, it, expect } from "vitest";
import { STATIC_VARIABLE_IDS } from "../constants";

describe("constants.ts", () => {
  describe("STATIC_VARIABLE_IDS", () => {
    it("should be an array of numbers", () => {
      expect(Array.isArray(STATIC_VARIABLE_IDS)).toBe(true);
      STATIC_VARIABLE_IDS.forEach((id) => {
        expect(typeof id).toBe("number");
      });
    });

    it("should contain expected variable IDs", () => {
      // Divisas
      expect(STATIC_VARIABLE_IDS).toContain(1);
      expect(STATIC_VARIABLE_IDS).toContain(4);
      expect(STATIC_VARIABLE_IDS).toContain(5);

      // Tasas de Interés
      expect(STATIC_VARIABLE_IDS).toContain(6);
      expect(STATIC_VARIABLE_IDS).toContain(7);
      expect(STATIC_VARIABLE_IDS).toContain(45);

      // Base Monetaria
      expect(STATIC_VARIABLE_IDS).toContain(15);
      expect(STATIC_VARIABLE_IDS).toContain(19);

      // Depósitos
      expect(STATIC_VARIABLE_IDS).toContain(21);
      expect(STATIC_VARIABLE_IDS).toContain(24);

      // Privados
      expect(STATIC_VARIABLE_IDS).toContain(25);
      expect(STATIC_VARIABLE_IDS).toContain(26);

      // Inflación
      expect(STATIC_VARIABLE_IDS).toContain(27);
      expect(STATIC_VARIABLE_IDS).toContain(28);
      expect(STATIC_VARIABLE_IDS).toContain(29);

      // Índices
      expect(STATIC_VARIABLE_IDS).toContain(30);
      expect(STATIC_VARIABLE_IDS).toContain(32);
      expect(STATIC_VARIABLE_IDS).toContain(40);
    });

    it("should have the correct number of IDs", () => {
      expect(STATIC_VARIABLE_IDS.length).toBe(34);
    });

    it("should not have duplicate IDs", () => {
      const uniqueIds = new Set(STATIC_VARIABLE_IDS);
      expect(uniqueIds.size).toBe(STATIC_VARIABLE_IDS.length);
    });
  });
});
