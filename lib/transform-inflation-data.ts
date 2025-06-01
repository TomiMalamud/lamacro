import * as fs from "fs";

function transformInflationData(inputData: string) {
  const jsonString = inputData.startsWith("[") ? inputData : `[${inputData}]`;

  const data = JSON.parse(jsonString);

  const transformed: Record<string, Record<number, number>> = {};

  data.forEach((record: { fecha: string; valor: number }) => {
    const date = new Date(record.fecha);
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1;

    const value = Number((record.valor / 100).toFixed(3));

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
