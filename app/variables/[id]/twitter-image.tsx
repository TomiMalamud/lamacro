import { fetchBCRADirect, fetchVariableTimeSeries } from "@/lib/bcra-fetch";
import { format, subMonths } from "date-fns";
import { ImageResponse } from "next/og";
import { formatNumber } from "@/lib/utils";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Variable BCRA | La Macro";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function getVariableData(id: number) {
  try {
    const desde = format(subMonths(new Date(), 3), "yyyy-MM-dd");
    const hasta = format(new Date(), "yyyy-MM-dd");

    const [timeSeriesData, allVariablesData] = await Promise.all([
      fetchVariableTimeSeries(id, desde, hasta),
      fetchBCRADirect(),
    ]);

    const variableInfo = allVariablesData.results.find(
      (v) => v.idVariable === id,
    );

    const latestDataPoint = timeSeriesData.results[0];
    const value = latestDataPoint?.valor || "N/A";
    const description = variableInfo?.descripcion || `Variable #${id}`;

    return {
      description: description.replace("n.a.", "TNA").replace("e.a.", "TEA"),
      value: typeof value === "number" ? formatNumber(value) : value.toString(),
    };
  } catch (error) {
    return {
      description: `Variable #${id}`,
      value: `Error loading data: ${error}`,
    };
  }
}

// Image generation
export default async function Image({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Invalid Variable ID
        </div>
      ),
      {
        ...size,
      },
    );
  }
  const geistBold = await readFile(
    join(process.cwd(), "assets/Geist-Bold.ttf"),
  );
  const geistRegular = await readFile(
    join(process.cwd(), "assets/Geist-Regular.ttf"),
  );
  const { description, value } = await getVariableData(id);

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#222222",
          padding: "60px",
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            fontSize: 36,
            marginBottom: "60px",
            fontWeight: 700,
            background: "linear-gradient(to right, #3b82f6, #0ea5e9, #3b82f6)",
            backgroundClip: "text",
            color: "transparent",
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          La Macro
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 64,
              marginBottom: "30px",
              fontWeight: 400,
              color: "#444444",
            }}
          >
            {description}
          </div>
          <div style={{ fontSize: 124, fontWeight: 700 }}>{value}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: geistBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Geist",
          data: geistRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
