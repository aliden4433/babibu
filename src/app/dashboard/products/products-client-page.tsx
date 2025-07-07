
"use client"

import * as React from "react"
import type { Product } from "@/lib/types"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProductFormDialog } from "./product-form-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ProductImportButton } from "./product-import-button"

interface ProductsClientPageProps {
    products: Product[];
}

export function ProductsClientPage({ products }: ProductsClientPageProps) {
    const isMobile = useIsMobile()
    const { user } = useAuth()
    const userRole = user?.role

    const columns = React.useMemo(() => getColumns(userRole), [userRole]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 flex-wrap">
                {userRole === 'admin' && <ProductImportButton />}
                {userRole === 'admin' && !isMobile && (
                    <ProductFormDialog>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Produk
                        </Button>
                    </ProductFormDialog>
                )}
            </div>
            <DataTable 
              columns={columns} 
              data={products} 
              userRole={userRole}
              filterColumnId="name"
              filterPlaceholder="Filter produk..."
            />
            {userRole === 'admin' && isMobile && (
                <ProductFormDialog>
                    <Button
                        className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20"
                        size="icon"
                    >
                        <PlusCircle className="h-7 w-7" />
                        <span className="sr-only">Tambah Produk</span>
                    </Button>
                </ProductFormDialog>
            )}
        </div>
    )
}
