
"use client"

import { useState } from "react"
import type { Table } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteExpenses } from "./actions"
import type { Expense, AppUser } from "@/lib/types"

interface ExpensesDataTableToolbarProps<TData> {
  table: Table<TData>
  userRole?: AppUser['role']
  filterColumnId?: string
  filterPlaceholder?: string
}

export function ExpensesDataTableToolbar<TData>({
  table,
  userRole,
  filterColumnId,
  filterPlaceholder,
}: ExpensesDataTableToolbarProps<TData>) {
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  async function handleDelete() {
    setIsDeleting(true)
    const selectedIds = selectedRows.map(
      (row) => (row.original as Expense).id!
    )
    const result = await deleteExpenses(selectedIds)
    if (result.success) {
      toast({
        title: "Sukses",
        description: result.message,
      })
      table.resetRowSelection()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      })
    }
    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
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
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus ({selectedRows.length})
          </Button>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus {selectedRows.length} pengeluaran secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Menghapus..." : "Hapus"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null }
    </div>
  )
}
