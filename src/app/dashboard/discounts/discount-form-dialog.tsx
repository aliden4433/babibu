
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createScheduledDiscount, updateScheduledDiscount } from "./actions";
import type { Product, ScheduledDiscount, ScheduledDiscountProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { logActivity } from "../logs/actions";

const productSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  originalPrice: z.coerce.number(),
  discountPrice: z.coerce.number().min(0, "Harga harus positif."),
  isSelected: z.boolean().default(false),
});

const formSchema = z.object({
  name: z.string().min(1, "Nama jadwal tidak boleh kosong."),
  dateRange: z.object({
    from: z.date({ required_error: "Tanggal mulai harus diisi." }),
    to: z.date({ required_error: "Tanggal selesai harus diisi." }),
  }),
  products: z.array(productSchema)
    .refine(arr => arr.some(p => p.isSelected), {
      message: "Pilih setidaknya satu produk.",
    }),
});

interface DiscountFormDialogProps {
  products: Product[];
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ScheduledDiscount;
}

export function DiscountFormDialog({ products, children, open, onOpenChange, initialData }: DiscountFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!initialData;
  const isDiscountActive = isEditMode && !!initialData?.isActive;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dateRange: {
        from: new Date(),
        to: addDays(new Date(), 7),
      },
      products: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "products",
  });

  useEffect(() => {
    if (open) {
      const defaultProducts = products.map(p => ({
          productId: p.id!,
          productName: p.name,
          originalPrice: p.price,
          discountPrice: p.price,
          isSelected: false,
      }));

      if (isEditMode && initialData) {
         const productsWithDiscountInfo = products.map(p => {
          const discountInfo = initialData.products.find(dp => dp.productId === p.id);
          return {
            productId: p.id!,
            productName: p.name,
            originalPrice: discountInfo ? discountInfo.originalPrice : p.price,
            discountPrice: discountInfo ? discountInfo.discountPrice : p.price,
            isSelected: !!discountInfo,
          };
        });

        form.reset({
          name: initialData.name,
          dateRange: { from: new Date(initialData.startDate), to: new Date(initialData.endDate) },
          products: productsWithDiscountInfo,
        });
      } else {
        form.reset({
          name: "",
          dateRange: { from: new Date(), to: addDays(new Date(), 7) },
          products: defaultProducts,
        });
      }
    }
  }, [open, products, form, initialData, isEditMode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const selectedProducts: ScheduledDiscountProduct[] = values.products
      .filter(p => p.isSelected)
      .map(p => ({
        productId: p.productId,
        productName: p.productName,
        originalPrice: p.originalPrice,
        discountPrice: p.discountPrice,
      }));

    if (selectedProducts.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Tidak ada produk yang dipilih." });
      setIsLoading(false);
      return;
    }
    
    try {
      const discountData = {
        name: values.name,
        startDate: values.dateRange.from.toISOString(),
        endDate: values.dateRange.to.toISOString(),
        products: selectedProducts,
      };
      
      let result;
      if (isEditMode && initialData?.id) {
        result = await updateScheduledDiscount(initialData.id, discountData);
      } else {
        result = await createScheduledDiscount(discountData);
      }
      
      if (result.success) {
        if (user) {
          const action = isEditMode ? 'UPDATE_DISCOUNT' : 'CREATE_DISCOUNT';
          const details = isEditMode
            ? `memperbarui jadwal diskon "${values.name}".`
            : `membuat jadwal diskon baru "${values.name}".`;
          await logActivity(user, action, details);
        }
        toast({ title: "Sukses", description: result.message });
        onOpenChange(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Jadwal Diskon" : "Buat Jadwal Diskon Baru"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? isDiscountActive 
                ? "Diskon sedang aktif. Anda hanya dapat mengubah nama dan tanggalnya." 
                : "Perbarui detail jadwal diskon Anda di bawah ini." 
              : "Atur nama, jadwal, pilih produk, dan tentukan harga diskonnya."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nama Jadwal Diskon</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Promo Akhir Tahun" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Tanggal Diskon</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value?.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value?.from ? (
                                field.value.to ? (
                                  <>
                                    {format(field.value.from, "d MMM yyyy", { locale: id })} - {" "}
                                    {format(field.value.to, "d MMM yyyy", { locale: id })}
                                  </>
                                ) : (
                                  format(field.value.from, "d MMM yyyy", { locale: id })
                                )
                              ) : (
                                <span>Pilih rentang tanggal</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={field.value?.from}
                            selected={field.value}
                            onSelect={field.onChange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Pilih Produk & Atur Harga Diskon</FormLabel>
              {form.formState.errors.products && <p className="text-sm font-medium text-destructive">{form.formState.errors.products.message}</p>}
              <fieldset disabled={isDiscountActive}>
                <ScrollArea className="h-64 mt-2 rounded-md border">
                  <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                              <TableHead className="w-[50px]">Pilih</TableHead>
                              <TableHead>Nama Produk</TableHead>
                              <TableHead className="text-right">Harga Asli</TableHead>
                              <TableHead className="text-right w-[180px]">Harga Diskon</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {fields.map((field, index) => (
                             <TableRow key={field.id} data-state={form.watch(`products.${index}.isSelected`) && "selected"}>
                              <TableCell>
                                  <Controller
                                      control={form.control}
                                      name={`products.${index}.isSelected`}
                                      render={({ field: controllerField }) => (
                                          <Checkbox
                                              checked={controllerField.value}
                                              onCheckedChange={controllerField.onChange}
                                          />
                                      )}
                                  />
                              </TableCell>
                              <TableCell className="font-medium">{field.productName}</TableCell>
                              <TableCell className="text-right">
                                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(field.originalPrice)}
                              </TableCell>
                              <TableCell>
                                 <Controller
                                      control={form.control}
                                      name={`products.${index}.discountPrice`}
                                      render={({ field: controllerField }) => (
                                          <Input
                                              type="number"
                                              className="text-right"
                                              {...controllerField}
                                              disabled={!form.watch(`products.${index}.isSelected`)}
                                          />
                                      )}
                                 />
                              </TableCell>
                             </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                </ScrollArea>
              </fieldset>
              {isDiscountActive && (
                <FormDescription>
                  Produk tidak dapat diubah untuk jadwal yang sedang aktif.
                </FormDescription>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Simpan Perubahan" : "Simpan Jadwal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
