import type { MetadataRoute } from "next";
import { STATIC_VARIABLE_IDS } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.lamacro.ar",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: "https://www.lamacro.ar/acciones",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://www.lamacro.ar/carry-trade",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://www.lamacro.ar/bonos-duales",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://www.lamacro.ar/fija",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://www.lamacro.ar/variables",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: "https://www.lamacro.ar/calculadora-de-inflacion",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://www.lamacro.ar/central-de-deudores",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    // Static variable pages
    ...STATIC_VARIABLE_IDS.map((id) => ({
      url: `https://www.lamacro.ar/variables/${id}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
  ];
}
