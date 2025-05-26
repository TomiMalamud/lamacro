"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFijaData } from "@/hooks/use-fija-data";
import { formatNumber } from "@/lib/utils";
import { FijaTableRow, SecurityData } from "@/types/fija";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface FijaTableProps {
  letras: SecurityData[];
  bonos: SecurityData[];
}

type SortColumn = "tna" | "tem" | "tea";
type SortDirection = "asc" | "desc" | null;
type FilterType = "all" | "Letra" | "Bono" | "Dual";

export default function FijaTable({ letras, bonos }: FijaTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchTicker, setSearchTicker] = useState("");

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

  const getSecurityType = (ticker: string): FilterType => {
    if (ticker.startsWith("TT")) return "Dual";
    if (ticker.startsWith("T")) return "Bono";
    if (ticker.startsWith("S")) return "Letra";
    return "all";
  };

  const filterData = (data: FijaTableRow[]): FijaTableRow[] => {
    return data.filter((row) => {
      const typeMatch =
        filterType === "all" || getSecurityType(row.ticker) === filterType;
      const tickerMatch =
        searchTicker === "" ||
        row.ticker.toLowerCase().includes(searchTicker.toLowerCase());
      return typeMatch && tickerMatch;
    });
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

  const filteredData = filterData(calculatedData);
  const tableData = sortData(filteredData);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Buscar por ticker..."
            value={searchTicker}
            onChange={(e) => setSearchTicker(e.target.value)}
            className="pl-10 dark:bg-neutral-900"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as FilterType)}
        >
          <SelectTrigger className="w-[180px] dark:bg-neutral-900">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="Letra">Letras</SelectItem>
            <SelectItem value="Bono">Bonos</SelectItem>
            <SelectItem value="Dual">Duales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card dark:bg-[#1C1C1E]">
              Ticker
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-center">Vencimiento</TableHead>
            <TableHead className="text-center">
              Liquidación Secundaria
            </TableHead>
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
              <TableCell className="sticky left-0 bg-card dark:bg-[#1C1C1E]">
                {row.ticker}
              </TableCell>
              <TableCell className="text-center">
                <div className="py-1 px-3 bg-muted rounded-md text-xs">
                  {getSecurityType(row.ticker)}
                </div>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {row.fechaVencimiento}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {row.liquiSecu}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {row.dias}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {formatNumber(row.meses)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {row.px > 0 ? formatNumber(row.px) : "-"}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
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
    </div>
  );
}
