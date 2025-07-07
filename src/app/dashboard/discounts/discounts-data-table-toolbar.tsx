
"use client"

import type { Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import type { AppUser } from "@/lib/types"

interface DiscountsDataTableToolbarProps<TData> {
  table: Table<TData>
  userRole?: AppUser['role']
  filterColumnId?: string
  filterPlaceholder?: string
}

export function DiscountsDataTableToolbar<TData>({
  table,
  filterColumnId,
  filterPlaceholder,
}: DiscountsDataTableToolbarProps<TData>) {
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
       {/* UI untuk menerapkan diskon telah dihapus karena fungsionalitasnya tidak ada. */}
    </div>
  )
}
