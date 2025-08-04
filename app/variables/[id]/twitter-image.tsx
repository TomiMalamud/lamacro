import { fetchBCRADirect, fetchVariableTimeSeries } from "@/lib/bcra-fetch";
import { formatDateAR } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { ImageResponse } from "next/og";

// Image metadata
export const alt = "Variable BCRA | La Macro";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function getVariableData(id: number) {
  const desde = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const hasta = format(new Date(), "yyyy-MM-dd");

  const [timeSeriesData, allVariablesData] = await Promise.all([
    fetchVariableTimeSeries(id, desde, hasta),
    fetchBCRADirect(),
  ]);

  const variableInfo = allVariablesData.results.find(
    (v) => v.idVariable === id,
  );

  return {
    timeSeriesData,
    variableInfo,
    variableDescription: variableInfo?.descripcion || `Variable #${id}`,
  };
}

// Image generation
export default async function Image({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            backgroundImage:
              "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: "bold",
              color: "#2d3748",
              textAlign: "center",
            }}
          >
            Variable no válida
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#718096",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            La Macro
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  }

  try {
    const { variableDescription, timeSeriesData } = await getVariableData(id);
    const latestDataPoint = timeSeriesData.results[0];

    const cleanDescription = variableDescription
      .replace("n.a.", "TNA")
      .replace("e.a.", "TEA");

    const value = latestDataPoint?.valor || "N/A";
    const lastUpdate = latestDataPoint
      ? formatDateAR(latestDataPoint.fecha)
      : "Sin datos";

    // Determine if the value looks like a percentage or rate
    const isPercentage =
      typeof value === "string" &&
      (value.includes("%") ||
        cleanDescription.toLowerCase().includes("tasa") ||
        cleanDescription.toLowerCase().includes("inflación") ||
        cleanDescription.toLowerCase().includes("interés"));

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            backgroundImage:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.05,
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)",
            }}
          />

          {/* Main content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              padding: "60px",
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {/* Chart icon */}
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: "#ffffff",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: "bold",
                    color: "#ffffff",
                  }}
                >
                  La Macro
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 24px",
                  borderRadius: "25px",
                  fontSize: 18,
                  color: "#ffffff",
                  fontWeight: "500",
                }}
              >
                BCRA
              </div>
            </div>

            {/* Main content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                flex: 1,
                justifyContent: "center",
              }}
            >
              {/* Variable description */}
              <div
                style={{
                  fontSize: 42,
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: 1.2,
                  marginBottom: "30px",
                  maxWidth: "900px",
                }}
              >
                {cleanDescription}
              </div>

              {/* Current value */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: 84,
                    fontWeight: "bold",
                    color: "#ffffff",
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {value}
                </div>
                {isPercentage && !value.toString().includes("%") && (
                  <div
                    style={{
                      fontSize: 48,
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: "500",
                    }}
                  >
                    %
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "40px",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Última actualización: {lastUpdate}
              </div>

              <div
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: "500",
                }}
              >
                Datos del Banco Central
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  } catch (error) {
    // Fallback image for errors
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            backgroundImage:
              "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              color: "#2d3748",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Variable BCRA #{id}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#718096",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            Banco Central de la República Argentina
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#4a5568",
              fontWeight: "bold",
            }}
          >
            La Macro
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  }
}
