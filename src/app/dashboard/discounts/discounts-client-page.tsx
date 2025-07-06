
"use client"

import * as React from "react"
import type { Product } from "@/lib/types"
import { columns } from "./columns"
import { DataTable } from "@/app/dashboard/products/data-table"
import { useAuth } from "@/hooks/use-auth"
import type { ColumnDef } from "@tanstack/react-table"

interface DiscountsClientPageProps {
    products: Product[];
}

export function DiscountsClientPage({ products }: DiscountsClientPageProps) {
    const { user } = useAuth()
    const userRole = user?.role

    const visibleColumns = React.useMemo(() => {
        if (userRole === 'admin') {
            return columns;
        }
        return columns.filter(col => col.id !== 'select');
    }, [userRole]) as ColumnDef<Product>[];

    return (
        <div className="space-y-4">
            <DataTable 
              columns={visibleColumns} 
              data={products} 
              userRole={userRole}
              filterColumnId="name"
              filterPlaceholder="Filter produk untuk diskon..."
              entityName="diskon"
            />
        </div>
    )
}
