
"use client";

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

import type { ScheduledDiscount, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DiscountCampaignCard } from './discount-campaign-card';
import { DiscountFormDialog } from './discount-form-dialog';

interface DiscountsClientPageProps {
  initialDiscounts: ScheduledDiscount[];
  products: Product[];
}

export function DiscountsClientPage({ initialDiscounts, products }: DiscountsClientPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [discountToEdit, setDiscountToEdit] = useState<ScheduledDiscount | undefined>();

  const handleOpenForm = (discount?: ScheduledDiscount) => {
    setDiscountToEdit(discount);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = (open: boolean) => {
    if (!open) {
      setDiscountToEdit(undefined);
    }
    setIsFormOpen(open);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DiscountFormDialog 
          products={products} 
          open={isFormOpen} 
          onOpenChange={handleCloseForm}
          initialData={discountToEdit}
        >
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Jadwal Diskon
          </Button>
        </DiscountFormDialog>
      </div>
      {initialDiscounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialDiscounts.map((discount) => (
            <DiscountCampaignCard key={discount.id} discount={discount} onEdit={handleOpenForm} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center h-64">
          <h3 className="text-lg font-semibold">Belum Ada Jadwal Diskon</h3>
          <p className="text-sm text-muted-foreground">Buat jadwal diskon pertama Anda untuk memulai promosi.</p>
        </div>
      )}
    </div>
  );
}
