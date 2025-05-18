"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DualBondTableEntry } from "@/lib/carry-trade";
import React from "react";

interface DualesTamarTableProps {
  tableDataTemDiff: DualBondTableEntry[];
  tableDataPayoffDiff: DualBondTableEntry[];
  title: string;
}

export const DualesTamarTable: React.FC<DualesTamarTableProps> = ({
  tableDataTemDiff,
  tableDataPayoffDiff,
  title,
}) => {
  if (
    !tableDataTemDiff ||
    tableDataTemDiff.length === 0 ||
    !tableDataPayoffDiff ||
    tableDataPayoffDiff.length === 0
  ) {
    return (
      <p className="text-center text-gray-500">No hay datos para la tabla.</p>
    );
  }

  const bonds = ["TTM26", "TTJ26", "TTS26", "TTD26"];

  // Find and extract "Meses de Payoff" row
  const mesesPayoffIndex = tableDataTemDiff.findIndex(
    (row) => row.label === "Meses de payoff",
  );
  const mesesPayoffRow =
    mesesPayoffIndex !== -1 ? tableDataTemDiff[mesesPayoffIndex] : null;

  // Filter out "Meses de payoff" row from the data
  const filteredTemDiff = tableDataTemDiff.filter(
    (row) => row.label !== "Meses de payoff",
  );
  const filteredPayoffDiff = tableDataPayoffDiff.filter(
    (row) => row.label !== "Meses de payoff",
  );

  // Function to find the highest value in a row for specified columns
  const findHighestValuesInRow = (
    row: DualBondTableEntry,
    bondKeys: string[],
  ): string[] => {
    // Extract numeric values from percentage strings
    const numericValues = bondKeys.map((key) => {
      const value = row[key as keyof DualBondTableEntry] as string;
      return parseFloat(value.replace("%", ""));
    });

    // Find the maximum value
    const maxValue = Math.max(...numericValues);

    // Find all keys that have the max value
    return bondKeys.filter((key) => {
      const value = row[key as keyof DualBondTableEntry] as string;
      return parseFloat(value.replace("%", "")) === maxValue;
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {mesesPayoffRow && (
          <CardDescription className="mt-2">
            <span className="font-bold mr-2">Meses de payoff:</span>
            {bonds.map((bond, index) => (
              <span key={bond} className="inline-block">
                {bond}: {mesesPayoffRow[bond as keyof DualBondTableEntry]}
                <span className="text-gray-500 mx-2">
                  {index < bonds.length - 1 ? " - " : ""}
                </span>
              </span>
            ))}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="pointer-events-none">
                Escenario
              </TableHead>
              <TableHead
                colSpan={4}
                className="text-center border-r border-border pointer-events-none"
              >
                TEM Diff
              </TableHead>
              <TableHead
                colSpan={4}
                className="text-center pointer-events-none"
              >
                Payoff Diff
              </TableHead>
            </TableRow>
            <TableRow>
              {bonds.map((bond) => (
                <TableHead
                  key={`tem-${bond}`}
                  className={`${bond === "TTD26" ? "border-r border-border" : ""} pointer-events-none`}
                >
                  {bond}
                </TableHead>
              ))}
              {bonds.map((bond) => (
                <TableHead
                  key={`payoff-${bond}`}
                  className="pointer-events-none"
                >
                  {bond}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemDiff.map((rowTem, rowIndex) => {
              const rowPayoff = filteredPayoffDiff[rowIndex];

              // Find winner cells for each row section
              const temWinners = findHighestValuesInRow(rowTem, bonds);
              const payoffWinners = rowPayoff
                ? findHighestValuesInRow(rowPayoff, bonds)
                : [];

              return (
                <TableRow key={rowIndex}>
                  <TableCell className="font-medium">{rowTem.label}</TableCell>

                  {bonds.map((bond) => (
                    <TableCell
                      key={`tem-${bond}`}
                      className={`text-gray-500 ${
                        temWinners.includes(bond)
                          ? "font-bold text-black dark:text-white"
                          : ""
                      } ${bond === "TTD26" ? "border-r border-border" : ""}`}
                    >
                      {rowTem[bond as keyof DualBondTableEntry]}
                    </TableCell>
                  ))}

                  {/* Payoff Diff cells */}
                  {rowPayoff &&
                    bonds.map((bond) => (
                      <TableCell
                        key={`payoff-${bond}`}
                        className={`text-gray-500 ${
                          payoffWinners.includes(bond)
                            ? "font-bold text-black dark:text-white"
                            : ""
                        }`}
                      >
                        {rowPayoff[bond as keyof DualBondTableEntry]}
                      </TableCell>
                    ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
