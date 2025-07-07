
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';

import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { updateStockOpname } from './actions';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '../logs/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Form } from '@/components/ui/form';
import { ExportStockOpnameButton } from './export-button';

const stockOpnameProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  systemStock: z.number(),
  actualStock: z.coerce
    .number({ invalid_type_error: "Harus angka" })
    .optional(),
});

const stockOpnameFormSchema = z.object({
  products: z.array(stockOpnameProductSchema),
});

export function StockOpnameClientPage({ initialProducts }: { initialProducts: Product[] }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof stockOpnameFormSchema>>({
    resolver: zodResolver(stockOpnameFormSchema),
    defaultValues: {
      products: [],
    },
  });

  const { fields, replace, update } = useFieldArray({
    control: form.control,
    name: "products",
  });
  
  const watchedProducts = form.watch('products');

  useEffect(() => {
    const productsWithActualStock = initialProducts.map((p) => ({
      id: p.id!,
      name: p.name,
      systemStock: p.stock,
      actualStock: undefined,
    }));
    replace(productsWithActualStock);
  }, [initialProducts, replace]);

  const onSubmit = async (data: z.infer<typeof stockOpnameFormSchema>) => {
    setIsSubmitting(true);
    const updates = data.products
      .filter(p => p.actualStock !== undefined && p.actualStock !== null && p.actualStock !== p.systemStock)
      .map(p => ({
        id: p.id,
        stock: p.actualStock!,
      }));

    if (updates.length === 0) {
      toast({ title: "Tidak Ada Perubahan", description: "Tidak ada stok yang diubah untuk disimpan." });
      setIsSubmitting(false);
      return;
    }

    const result = await updateStockOpname(updates);

    if (result.success) {
      if (user) {
        await logActivity(user, 'STOCK_OPNAME', `memperbarui stok untuk ${updates.length} produk.`);
      }
      toast({ title: "Sukses", description: result.message });
      // Update system stock in the UI after successful submission
      updates.forEach(updateData => {
        const productIndex = fields.findIndex(field => field.id === updateData.id);
        if (productIndex !== -1) {
          update(productIndex, { 
              ...fields[productIndex], 
              systemStock: updateData.stock,
              actualStock: undefined,
          });
        }
      });
      form.reset(form.getValues(), { keepValues: true, keepDirty: false });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsSubmitting(false);
  };
  
  if (isMobile === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-24" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const stockOpnameForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-end gap-2">
          <ExportStockOpnameButton products={watchedProducts} />
          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </div>

        {isMobile ? (
          <div className="space-y-4">
            {fields.map((field, index) => {
               const actualStock = form.watch(`products.${index}.actualStock`);
               const difference = (actualStock ?? field.systemStock) - field.systemStock;
               return (
                <Card key={field.id}>
                    <CardContent className="p-4 space-y-4">
                        <p className="font-medium">{field.name}</p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Sistem</p>
                                <p className="font-semibold text-lg">{field.systemStock}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Aktual</p>
                                <Input
                                    type="number"
                                    placeholder="Input"
                                    className="text-center h-9"
                                    {...form.register(`products.${index}.actualStock`)}
                                />
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Selisih</p>
                                <p className={`font-semibold text-lg ${difference > 0 ? 'text-green-500' : difference < 0 ? 'text-red-500' : ''}`}>
                                    {difference > 0 ? `+${difference}` : difference}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
               )
            })}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="w-[150px] text-right">Stok Sistem</TableHead>
                  <TableHead className="w-[150px] text-right">Stok Aktual</TableHead>
                  <TableHead className="w-[150px] text-right">Selisih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const actualStock = form.watch(`products.${index}.actualStock`);
                  const difference = (actualStock ?? field.systemStock) - field.systemStock;
                  return (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell className="text-right">{field.systemStock}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        placeholder={`${field.systemStock}`}
                        className="text-right mx-auto max-w-[100px]"
                        {...form.register(`products.${index}.actualStock`)}
                      />
                    </TableCell>
                    <TableCell className={`text-right font-medium ${difference > 0 ? 'text-green-500' : difference < 0 ? 'text-red-500' : ''}`}>
                       {difference > 0 ? `+${difference}` : difference}
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        )}
      </form>
    </Form>
  );

  return stockOpnameForm;
}
