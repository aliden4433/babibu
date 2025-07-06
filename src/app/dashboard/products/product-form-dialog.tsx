
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
import { addProduct, updateProduct } from "./actions"
import type { Product } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(1, "Nama produk tidak boleh kosong."),
  price: z.coerce.number().min(0, "Harga harus angka positif."),
  costPrice: z.coerce.number().min(0, "Harga modal harus angka positif."),
  stock: z.coerce.number().int("Stok harus berupa bilangan bulat."),
})

interface ProductFormDialogProps {
  product?: Product
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProductFormDialog({ product, children, open: openProp, onOpenChange: onOpenChangeProp }: ProductFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChangeProp !== undefined ? onOpenChangeProp : setInternalOpen;
  
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isEditMode = !!product

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      costPrice: 0,
      stock: 0,
    },
  })
  
  useEffect(() => {
    if (open) {
      if (isEditMode && product) {
        form.reset(product);
      } else {
        form.reset({
          name: "",
          price: 0,
          costPrice: 0,
          stock: 0,
        });
      }
    }
  }, [product, isEditMode, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      let result;
      const productData = {
        name: values.name,
        price: values.price,
        costPrice: values.costPrice,
        stock: values.stock,
      }
      if (isEditMode && product?.id) {
        result = await updateProduct(product.id, productData)
      } else {
        result = await addProduct(productData)
      }

      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        })
        setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Perbarui detail produk di bawah ini." : "Isi detail untuk produk baru."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kopi Susu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
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
                      <Input type="number" placeholder="0" {...field} />
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
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Simpan Perubahan" : "Simpan Produk"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
