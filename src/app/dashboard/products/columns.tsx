
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product, AppUser } from "@/lib/types"
import { ProductRowActions } from "./product-row-actions"
import { ProductFormDialog } from "./product-form-dialog"

const NameCell = ({ product, userRole }: { product: Product, userRole?: AppUser['role'] }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  const canEdit = userRole === 'admin';

  // New logic for variants
  const nameParts = product.name.split(" - ");
  const baseName = nameParts[0];
  const variantDescription = nameParts.length > 1 ? nameParts.slice(1).join(" - ") : null;


  return (
    <>
      {canEdit && (
        <ProductFormDialog
          product={product}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
      <button
        onClick={() => canEdit && setIsEditDialogOpen(true)}
        disabled={!canEdit}
        className="font-medium text-left hover:underline disabled:no-underline disabled:cursor-text"
      >
        {baseName}
        {variantDescription && (
            <span className="block text-xs text-muted-foreground font-normal">
                {variantDescription}
            </span>
        )}
      </button>
    </>
  )
}

export const getColumns = (userRole?: AppUser['role']): ColumnDef<Product>[] => {
    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
              return (
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  Nama
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              )
            },
            cell: ({ row }) => {
              return <NameCell product={row.original} userRole={userRole} />
            },
        },
        {
            accessorKey: "price",
            header: ({ column }) => {
              return (
                <div className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                      Harga Jual
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              )
            },
            cell: ({ row }) => {
              const amount = parseFloat(row.getValue("price"))
              const formatted = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(amount)
              return <div className="text-right font-medium">{formatted}</div>
            },
        },
        {
            accessorKey: "stock",
            header: ({ column }) => {
              return (
                <div className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  >
                    Stok
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )
            },
            cell: ({ row }) => {
              return <div className="text-right font-medium">{row.getValue("stock")}</div>
            },
        },
    ]

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

        columns.splice(3, 0, {
            accessorKey: "costPrice",
            header: ({ column }) => {
              return (
                <div className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                      Harga Modal
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              )
            },
            cell: ({ row }) => {
              const amount = parseFloat(row.getValue("costPrice"))
              const formatted = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(amount)
              return <div className="text-right font-medium">{formatted}</div>
            },
        });

        columns.push({
            id: "actions",
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => {
              const product = row.original
              return (
                <div className="text-right">
                  <ProductRowActions product={product} />
                </div>
              )
            },
            enableSorting: false,
            enableHiding: false,
        });
    }

    return columns;
}
