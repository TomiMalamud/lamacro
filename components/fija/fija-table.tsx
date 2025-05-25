"use client";

import { SecurityData, FijaTableRow } from "@/types/fija";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useFijaData } from "@/hooks/use-fija-data";

interface FijaTableProps {
  letras: SecurityData[];
  bonos: SecurityData[];
}

type SortColumn = "tna" | "tem" | "tea";
type SortDirection = "asc" | "desc" | null;

export default function FijaTable({ letras, bonos }: FijaTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { tableData: calculatedData } = useFijaData({ letras, bonos });

  const handleSort = (column: SortColumn) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortDirection("asc");
    } else {
      setSortColumn(null);
      setSortDirection(null);
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ml-2" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown size={14} className="ml-2" />;
    }
    return <ArrowUp size={14} className="ml-2" />;
  };

  const sortData = (data: FijaTableRow[]): FijaTableRow[] => {
    if (!sortColumn || !sortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === 0 && bValue === 0) return 0;
      if (aValue === 0) return 1;
      if (bValue === 0) return -1;

      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const tableData = sortData(calculatedData);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-center">Vencimiento</TableHead>
          <TableHead className="text-center">Liquidación Secundaria</TableHead>
          <TableHead className="text-center">Días</TableHead>
          <TableHead className="text-center">Meses</TableHead>
          <TableHead className="text-center">Precio actual</TableHead>
          <TableHead className="text-center">Pago Final</TableHead>
          <TableHead className="text-right">
            <Button
              variant="ghost"
              onClick={() => handleSort("tna")}
              className="h-8"
            >
              TNA
              {getSortIcon("tna")}
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button
              variant="ghost"
              onClick={() => handleSort("tem")}
              className="h-8"
            >
              TEM
              {getSortIcon("tem")}
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button
              variant="ghost"
              onClick={() => handleSort("tea")}
              className="h-8"
            >
              TEA
              {getSortIcon("tea")}
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((row) => (
          <TableRow key={row.ticker}>
            <TableCell>{row.ticker}</TableCell>
            <TableCell className="text-center">
              {row.fechaVencimiento}
            </TableCell>
            <TableCell className="text-center">{row.liquiSecu}</TableCell>
            <TableCell className="text-center">{row.dias}</TableCell>
            <TableCell className="text-center">
              {formatNumber(row.meses)}
            </TableCell>
            <TableCell className="text-center">
              {row.px > 0 ? formatNumber(row.px) : "-"}
            </TableCell>
            <TableCell className="text-center">
              {formatNumber(row.pagoFinal)}
            </TableCell>
            <TableCell className="text-center">
              {row.px > 0 && row.tna < 1
                ? formatNumber(row.tna, 2, "percentage")
                : "-"}
            </TableCell>
            <TableCell className="text-center">
              {row.px > 0 && row.meses > 0 && row.tna < 1
                ? formatNumber(row.tem, 2, "percentage")
                : "-"}
            </TableCell>
            <TableCell className="text-center">
              {row.px > 0 && row.tna < 1
                ? formatNumber(row.tea, 2, "percentage")
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
