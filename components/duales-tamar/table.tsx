"use client";

import React from "react";
import { type DualBondTableEntry } from "@/lib/carry-trade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from "clsx";

interface DualesTamarTableProps {
  tableData: DualBondTableEntry[];
  title: string;
}

export const DualesTamarTable: React.FC<DualesTamarTableProps> = ({
  tableData,
  title,
}) => {
  if (!tableData || tableData.length === 0) {
    return (
      <p className="text-center text-gray-500">No hay datos para la tabla.</p>
    );
  }
  const headers = ["Escenario", "TTM26", "TTJ26", "TTS26", "TTD26"];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIndex) => (
              <TableRow key={rowIndex} className={clsx()}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>{row.TTM26}</TableCell>
                <TableCell>{row.TTJ26}</TableCell>
                <TableCell>{row.TTS26}</TableCell>
                <TableCell>{row.TTD26}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
