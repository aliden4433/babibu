
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import type { Expense, ExpenseCategoryDoc, AppUser } from "@/lib/types";
import { ExpenseRowActions } from "./expense-row-actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (categories: ExpenseCategoryDoc[], userRole?: AppUser['role']): ColumnDef<Expense>[] => {
  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return (
          <div className="font-medium">
            {format(date, "d MMM yyyy", { locale: id })}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Kategori
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => {
          return <div className="text-left">{row.getValue("description")}</div>
      }
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Jumlah
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "recordedBy",
      header: "Dicatat oleh",
      cell: ({ row }) => {
        const recordedBy = row.original.recordedBy;
        return <div className="text-left truncate">{recordedBy?.email || "N/A"}</div>;
      },
      enableSorting: false,
    },
  ];

  if (userRole === 'admin') {
    columns.unshift({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });

    columns.push({
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="text-right">
            <ExpenseRowActions expense={expense} categories={categories} />
          </div>
        );
      },
      enableSorting: false,
    });
  }

  return columns;
};
