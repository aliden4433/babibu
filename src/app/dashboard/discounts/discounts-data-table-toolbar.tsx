
"use client"

import { useState } from "react"
import type { Table } from "@tanstack/react-table"
import { Tag, Loader2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { applyDiscountToProducts } from "../products/actions"
import type { Product, AppUser } from "@/lib/types"

interface DiscountsDataTableToolbarProps<TData> {
  table: Table<TData>
  userRole?: AppUser['role']
  filterColumnId?: string
  filterPlaceholder?: string
}

export function DiscountsDataTableToolbar<TData>({
  table,
  userRole,
  filterColumnId,
  filterPlaceholder,
}: DiscountsDataTableToolbarProps<TData>) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [discount, setDiscount] = useState("")
  const selectedRows = table.getFilteredSelectedRowModel().rows

  async function handleApplyDiscount() {
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
        toast({
            variant: "destructive",
            title: "Input Tidak Valid",
            description: "Harap masukkan persentase diskon antara 1 dan 100.",
        })
        return
    }

    setIsLoading(true)
    const selectedIds = selectedRows.map(
      (row) => (row.original as Product).id!
    )
    const result = await applyDiscountToProducts(selectedIds, discountValue)
    
    if (result.success) {
      toast({
        title: "Sukses",
        description: result.message,
      })
      table.resetRowSelection()
      setDiscount("")
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      })
    }
    setIsLoading(false)
  }

  const filterColumn = filterColumnId ? table.getColumn(filterColumnId) : undefined;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterColumn && (
          <Input
            placeholder={filterPlaceholder || "Filter..."}
            value={(filterColumn.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              filterColumn.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
      </div>
      {userRole === 'admin' && selectedRows.length > 0 ? (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
                {selectedRows.length} produk dipilih
            </span>
            <div className="relative w-32">
                <Input
                    type="number"
                    placeholder="Diskon %"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="pr-8"
                    disabled={isLoading}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">%</span>
            </div>
          <Button
            onClick={handleApplyDiscount}
            disabled={isLoading || !discount}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Tag className="mr-2 h-4 w-4" />
            Terapkan
          </Button>
        </div>
      ) : null }
    </div>
  )
}
