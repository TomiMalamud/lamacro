"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { FijaTableRow } from "@/types/fija";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Search,
} from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "sonner";

interface FijaTableProps {
  tableData: FijaTableRow[];
}

type SortColumn = "tna" | "tem" | "tea";
type SortDirection = "asc" | "desc" | null;
type FilterType = "all" | "Letra" | "Bono" | "Dual";

export default function FijaTable({
  tableData: calculatedData,
}: FijaTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchTicker, setSearchTicker] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

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

  // Export data to Excel
  const exportToExcel = () => {
    setExportLoading(true);

    try {
      // Create Excel workbook data
      const worksheetData = [
        [
          "Tipo",
          "Ticker",
          "Vencimiento",
          "Días",
          "Meses",
          "Pago Final",
          "Precio Actual",
          "TNA",
          "TEM",
          "TEA",
        ],
        ...tableData.map((row) => [
          getSecurityType(row.ticker),
          row.ticker,
          row.fechaVencimiento,
          row.dias,
          row.meses,
          row.pagoFinal,
          row.px > 0 ? row.px : 0,
          row.px > 0 && row.tna < 1 ? row.tna : 0,
          row.px > 0 && row.meses > 0 && row.tna < 1 ? row.tem : 0,
          row.px > 0 && row.tna < 1 ? row.tea : 0,
        ]),
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Renta Fija");

      // Export file
      XLSX.writeFile(
        workbook,
        `La_Macro_renta_fija_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Archivo exportado correctamente", {
        description: "Revisá tu carpeta de descargas",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error al exportar el archivo", {
        description: "Intenta nuevamente",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-sm">
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
          <SelectTrigger className="md:w-[180px] dark:bg-neutral-900 w-full">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="Letra">Letras</SelectItem>
            <SelectItem value="Bono">Bonos</SelectItem>
            <SelectItem value="Dual">Duales</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="default"
          onClick={exportToExcel}
          disabled={exportLoading || tableData.length === 0}
          className="whitespace-nowrap md:w-[180px] w-full dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          {exportLoading ? (
            "Exportando..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden md:block">Exportar Excel</span>
              <span className="block md:hidden">Excel</span>
            </>
          )}
        </Button>
      </div>
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="sticky left-0 bg-card dark:bg-[#1C1C1E] sm:hidden">
                Ticker
              </TableHead>
              <TableHead className="hidden sm:table-cell">Ticker</TableHead>
              <TableHead className="text-center">Vencimiento</TableHead>
              <TableHead className="text-center">Días</TableHead>
              <TableHead className="text-center">Pago Final</TableHead>
              <TableHead className="text-center">Precio actual</TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tem")}
                  className="h-8"
                >
                  TEM
                  {getSortIcon("tem")}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tna")}
                  className="h-8"
                >
                  TNA
                  {getSortIcon("tna")}
                </Button>
              </TableHead>
              <TableHead className="text-center">
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
                <TableCell className="text-center">
                  <div className="py-1 px-2 bg-muted rounded-md text-xs">
                    {getSecurityType(row.ticker)}
                  </div>
                </TableCell>
                <TableCell className="sticky left-0 bg-card dark:bg-[#1C1C1E] sm:hidden">
                  {row.ticker}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {row.ticker}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {row.fechaVencimiento}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger className="text-center text-muted-foreground">
                      {row.dias}
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatNumber(row.meses)} meses
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatNumber(row.pagoFinal)}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {row.px > 0 ? formatNumber(row.px) : "-"}
                </TableCell>
                <TableCell className="text-center">
                  {row.px > 0 && row.meses > 0 && row.tna < 1
                    ? formatNumber(row.tem, 2, "percentage")
                    : "-"}
                </TableCell>
                <TableCell className="text-center">
                  {row.px > 0 && row.tna < 1
                    ? formatNumber(row.tna, 2, "percentage")
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
      </TooltipProvider>
    </div>
  );
}
