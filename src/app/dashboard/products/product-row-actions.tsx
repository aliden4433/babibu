
"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

import type { Product } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { deleteProduct, duplicateProduct } from "./actions"
import { ProductFormDialog } from "./product-form-dialog"
import { useAuth } from "@/hooks/use-auth"
import { logActivity } from "../logs/actions"

interface ProductRowActionsProps {
  product: Product
}

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  async function handleDuplicate() {
    if (!product) return;
    setIsDuplicating(true);
    const { id, ...productToDuplicate } = product;
    try {
      const result = await duplicateProduct(productToDuplicate);
      if (result.success) {
        if (user) {
          await logActivity(user, 'DUPLICATE_PRODUCT', `menduplikasi produk "${product.name}".`);
        }
        toast({
          title: "Sukses",
          description: "Produk duplikat telah dibuat.",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menduplikasi produk.",
      });
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!product.id) return
    setIsDeleting(true)
    try {
      const result = await deleteProduct(product.id)
      if (result.success) {
        if (user) {
          await logActivity(user, 'DELETE_PRODUCT', `menghapus produk "${product.name}".`);
        }
        toast({
          title: "Sukses",
          description: result.message,
        })
        setIsDeleteDialogOpen(false)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus produk.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ProductFormDialog product={product} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus produk <span className="font-semibold">{product.name}</span> secara permanen.
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
            <Copy className="mr-2 h-4 w-4" />
            <span>{isDuplicating ? "Menduplikasi..." : "Duplikat"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:bg-red-50 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Hapus</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
