
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { updateProductsBatch } from "./actions"
import type { Product } from "@/lib/types"

const formSchema = z.object({
  price: z.coerce.number().min(0, "Harga harus angka positif.").optional().or(z.literal('')),
  costPrice: z.coerce.number().min(0, "Harga modal harus angka positif.").optional().or(z.literal('')),
  stock: z.coerce.number().int("Stok harus berupa bilangan bulat.").optional().or(z.literal('')),
})

interface ProductBulkEditDialogProps {
  products: Product[]
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProductBulkEditDialog({ products, children, open, onOpenChange, onSuccess }: ProductBulkEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (open) {
      form.reset({
        price: '',
        costPrice: '',
        stock: '',
      });
    }
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const productIds = products.map(p => p.id!);
      const updateData: Partial<Product> = {};

      if (values.price !== '' && values.price !== undefined) updateData.price = values.price;
      if (values.costPrice !== '' && values.costPrice !== undefined) updateData.costPrice = values.costPrice;
      if (values.stock !== '' && values.stock !== undefined) updateData.stock = values.stock;

      if (Object.keys(updateData).length === 0) {
        toast({
          variant: "destructive",
          title: "Tidak ada perubahan",
          description: "Harap isi setidaknya satu kolom untuk diperbarui.",
        })
        setIsLoading(false)
        return
      }

      const result = await updateProductsBatch(productIds, updateData)

      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        })
        onOpenChange(false)
        onSuccess()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Massal Produk</DialogTitle>
          <DialogDescription>
            Perbarui {products.length} produk terpilih. Hanya kolom yang diisi yang akan diperbarui. Biarkan kosong untuk tidak mengubah.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Tidak berubah" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Modal</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Tidak berubah" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stok</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Tidak berubah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
