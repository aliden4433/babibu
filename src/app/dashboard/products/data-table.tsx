
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table"
import { format } from "date-fns";
import { id } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableToolbar } from "./data-table-toolbar"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Product, AppUser, Expense, ExpenseCategoryDoc } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge";
import { ProductRowActions } from "./product-row-actions"
import { ProductFormDialog } from "./product-form-dialog"
import { ExpenseRowActions } from "@/app/dashboard/expenses/expense-row-actions"
import { ExpenseFormDialog } from "@/app/dashboard/expenses/expense-form-dialog"
import { ExpensesDataTableToolbar } from "@/app/dashboard/expenses/expenses-data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  userRole?: AppUser['role']
  filterColumnId?: string
  filterPlaceholder?: string
  categories?: ExpenseCategoryDoc[]
  entityName?: string
}

const ProductMobileCard = ({ row, userRole }: { row: any, userRole?: AppUser['role'] }) => {
  const product = row.original as Product
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  const nameParts = product.name.split(" - ");
  const baseName = nameParts[0];
  const variantDescription = nameParts.length > 1 ? nameParts.slice(1).join(" - ") : null;


  return (
    <>
       {userRole === 'admin' && (
         <ProductFormDialog
            product={product}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
      )}
      <Card key={row.id} data-state={row.getIsSelected() && "selected"} className="bg-card">
        <CardContent className="p-4 flex gap-4 items-start">
           {userRole === 'admin' && (
              <div className="pt-1">
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Select row"
                />
              </div>
           )}
          <div className="flex-grow space-y-2 overflow-hidden">
              <div className="flex justify-between items-start">
                <button
                  onClick={() => userRole === 'admin' && setIsEditDialogOpen(true)}
                  disabled={userRole !== 'admin'}
                  className="font-semibold pr-2 break-words text-left hover:underline disabled:no-underline disabled:cursor-text"
                >
                  {baseName}
                  {variantDescription && (
                    <span className="block text-xs text-muted-foreground font-normal">
                        {variantDescription}
                    </span>
                  )}
                </button>
                 {userRole === 'admin' && (
                    <div className="-mt-2 -mr-2 flex-shrink-0">
                      <ProductRowActions product={product} />
                    </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                 <div className="flex justify-between">
                     <span>Harga Jual</span>
                     <span className="font-medium text-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.price)}</span>
                 </div>
                 {userRole === 'admin' && (
                    <div className="flex justify-between">
                       <span>Harga Modal</span>
                       <span className="font-medium text-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.costPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                     <span>Stok</span>
                     <span className="font-medium text-foreground">{product.stock}</span>
                 </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

const ExpenseMobileCard = ({ row, userRole, categories = [] }: { row: any, userRole?: AppUser['role'], categories?: ExpenseCategoryDoc[] }) => {
    const expense = row.original as Expense
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

    return (
        <>
            {userRole === 'admin' && (
                <ExpenseFormDialog
                    expense={expense}
                    categories={categories}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
            <Card key={row.id} data-state={row.getIsSelected() && "selected"} className="bg-card">
                <CardContent className="p-4 flex gap-4 items-start">
                    {userRole === 'admin' && (
                        <div className="pt-1">
                            <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(!!value)}
                                aria-label="Select row"
                            />
                        </div>
                    )}
                    <div className="flex-grow space-y-2 overflow-hidden">
                        <div className="flex justify-between items-start">
                             <button
                                onClick={() => userRole === 'admin' && setIsEditDialogOpen(true)}
                                disabled={userRole !== 'admin'}
                                className="font-semibold pr-2 break-words text-left hover:underline disabled:no-underline disabled:cursor-text"
                            >
                                {expense.description}
                            </button>
                            {userRole === 'admin' && (
                                <div className="-mt-2 -mr-2 flex-shrink-0">
                                <ExpenseRowActions expense={expense} categories={categories} />
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-medium text-foreground">{format(new Date(expense.date), "d MMM yyyy", { locale: id })}</span>
                            </div>
                             <div className="flex justify-between">
                                <span>Kategori</span>
                                <Badge variant="outline">{expense.category}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah</span>
                                <span className="font-medium text-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(expense.amount)}</span>
                            </div>
                             {expense.recordedBy && (
                                <div className="flex justify-between">
                                    <span>Dicatat oleh</span>
                                    <span className="font-medium text-foreground truncate">{expense.recordedBy.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

const MobileCard = ({ row, userRole, categories, entityName }: { row: any, userRole?: AppUser['role'], categories?: ExpenseCategoryDoc[], entityName?: string }) => {
    const isExpense = entityName === 'pengeluaran';

    if (isExpense) {
        return <ExpenseMobileCard row={row} userRole={userRole} categories={categories} />;
    }
    return <ProductMobileCard row={row} userRole={userRole} />;
};


export function DataTable<TData, TValue>({
  columns,
  data,
  userRole,
  filterColumnId,
  filterPlaceholder,
  categories = [],
  entityName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const isMobile = useIsMobile()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  const renderToolbar = () => {
    switch (entityName) {
      case "pengeluaran":
        return <ExpensesDataTableToolbar table={table} userRole={userRole} filterColumnId={filterColumnId} filterPlaceholder={filterPlaceholder} />;
      default:
        return <DataTableToolbar table={table} userRole={userRole} filterColumnId={filterColumnId} filterPlaceholder={filterPlaceholder} />;
    }
  }

  // Mobile card view. `isMobile` is false on first render, so this avoids hydration errors.
  if (isMobile) {
    return (
      <div className="space-y-4">
        {renderToolbar()}
        <div className="space-y-4 pb-4">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => <MobileCard key={row.id} row={row} userRole={userRole} categories={categories} entityName={entityName} />)
            ) : (
              <Card>
                <CardContent className="h-24 flex items-center justify-center text-muted-foreground">
                  Tidak ada hasil.
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="space-y-4">
      {renderToolbar()}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada hasil.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
