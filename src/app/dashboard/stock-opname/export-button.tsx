
"use client";

import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

interface StockOpnameProduct {
  id: string;
  name: string;
  systemStock: number;
  actualStock?: number | undefined;
}

interface ExportStockOpnameButtonProps {
  products: StockOpnameProduct[];
  disabled?: boolean;
}

export function ExportStockOpnameButton({ products, disabled }: ExportStockOpnameButtonProps) {
  const handleExport = () => {
    const dataToExport = products.map(product => {
      const actualStockValue = product.actualStock;
      const hasActualStock = typeof actualStockValue === 'number';
      
      const actualStockDisplay = hasActualStock ? actualStockValue : '';
      const differenceDisplay = hasActualStock ? (actualStockValue ?? 0) - product.systemStock : '';
      
      return {
        "Nama Produk": product.name,
        "Stok Sistem": product.systemStock,
        "Stok Aktual": actualStockDisplay,
        "Selisih": differenceDisplay,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok Opname");

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 50 }, // Nama Produk
      { wch: 15 }, // Stok Sistem
      { wch: 15 }, // Stok Aktual
      { wch: 15 }, // Selisih
    ];

    XLSX.writeFile(workbook, `Laporan_Stok_Opname_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || products.length === 0}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Export Laporan
    </Button>
  );
}
