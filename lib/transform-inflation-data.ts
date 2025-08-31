import * as fs from "fs";

export function transformInflationData(
  inputData: string,
): Record<string, Record<number, number>> {
  const jsonString = inputData.trim().startsWith("[")
    ? inputData
    : `[${inputData}]`;

  const data = JSON.parse(jsonString);

  const transformed: Record<string, Record<number, number>> = {};

  data.forEach((record: { fecha?: string; valor?: number }) => {
    if (
      !record ||
      typeof record.fecha !== "string" ||
      typeof record.valor !== "number"
    ) {
      return;
    }

    const parts = record.fecha.split("-");
    if (parts.length !== 3) {
      return;
    }

    const yearNum = Number(parts[0]);
    const monthNum = Number(parts[1]);
    if (
      !Number.isInteger(yearNum) ||
      !Number.isInteger(monthNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return;
    }

    const year = String(yearNum);
    const month = monthNum;

    let value = Number((record.valor / 100).toFixed(3));
    if (Object.is(value, -0)) value = 0;

    if (!transformed[year]) {
      transformed[year] = {};
    }

    transformed[year][month] = value;
  });

  return transformed;
}

try {
  const inputData = fs.readFileSync("lib/input-data.json", "utf8");

  const transformed = transformInflationData(inputData);

  fs.writeFileSync(
    "historical-inflation.json",
    JSON.stringify(transformed),
    "utf8",
  );
} catch (error) {
  console.error("Error processing data:", error);
}
