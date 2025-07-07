
"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Loader2, Calendar as CalendarIcon, X, PlusCircle, Check } from "lucide-react"

import type { Product, Sale, SaleItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { updateSale, type SaleUpdatePayload } from "./actions"

interface SaleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  products: Product[];
  onSuccess: (updatedSale: Sale) => void;
}

export function SaleEditDialog({ open, onOpenChange, sale, products, onSuccess }: SaleEditDialogProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [transactionDate, setTransactionDate] = useState<Date | undefined>();
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false)
  const { toast } = useToast();

  useEffect(() => {
    if (sale) {
      setItems(sale.items.map(item => ({ ...item })));
      setTransactionDate(new Date(sale.date));
      setDiscountAmount(sale.discount);
      setDiscountPercentage(sale.discountPercentage || 0);
    } else {
      setItems([]);
      setTransactionDate(undefined);
      setDiscountAmount(0);
      setDiscountPercentage(0);
    }
  }, [sale]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);
  
  const { totalCost, profit, total } = useMemo(() => {
    const totalCost = items.reduce((acc, item) => acc + (item.costPrice || 0) * item.quantity, 0);
    const total = subtotal - discountAmount;
    const profit = total - totalCost;
    return { totalCost, profit, total };
  }, [items, discountAmount, subtotal]);

  const handleDiscountPercentageChange = (value: number) => {
    const percentage = Math.max(0, Math.min(100, value || 0));
    setDiscountPercentage(percentage);
    const newAmount = subtotal * (percentage / 100);
    setDiscountAmount(newAmount);
  };

  const handleDiscountAmountChange = (value: number) => {
    const amount = Math.max(0, value || 0);
    setDiscountAmount(amount);
    if (subtotal > 0) {
        const newPercentage = (amount / subtotal) * 100;
        setDiscountPercentage(newPercentage);
    } else {
        setDiscountPercentage(0);
    }
  };

  const handleItemChange = (productId: string, field: 'quantity' | 'price', value: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleItemRemove = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.productId !== productId));
  };
  
  const handleAddProduct = (product: Product) => {
    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
       handleItemChange(product.id!, 'quantity', existingItem.quantity + 1);
    } else {
       setItems(currentItems => [...currentItems, {
           productId: product.id!,
           productName: product.name,
           quantity: 1,
           price: product.price,
           costPrice: product.costPrice || 0,
       }]);
    }
    setOpenCombobox(false);
  };

  const handleSubmit = async () => {
    if (!sale || !transactionDate) return;
    setIsLoading(true);
    
    try {
      const payload: SaleUpdatePayload = {
        id: sale.id,
        items,
        date: transactionDate.toISOString(),
        discount: discountAmount,
        discountPercentage,
        subtotal,
        totalCost,
        profit,
        total,
      };

      const result = await updateSale(payload);
      if (result.success) {
        toast({ title: "Sukses", description: result.message });
        const updatedSaleData: Sale = { ...sale, ...payload };
        onSuccess(updatedSaleData);
        onOpenChange(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui transaksi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
          <DialogDescription>
            Ubah detail transaksi untuk ID: {sale?.transactionId}. Perubahan akan menyesuaikan stok produk.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
              <Label htmlFor="transaction-date">Tanggal Transaksi</Label>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button id="transaction-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !transactionDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {transactionDate ? format(transactionDate, "d MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={transactionDate} onSelect={setTransactionDate} initialFocus />
                  </PopoverContent>
              </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="discount-percentage">Diskon (%)</Label>
                  <Input
                      id="discount-percentage"
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => handleDiscountPercentageChange(parseFloat(e.target.value))}
                      step="0.1"
                      min="0"
                      max="100"
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="discount-amount">Potongan Diskon (Rp)</Label>
                  <Input
                      id="discount-amount"
                      type="number"
                      value={discountAmount}
                      onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value))}
                      step="100"
                      min="0"
                  />
              </div>
          </div>
        </div>

        <div className="space-y-4">
            <Label>Item Transaksi</Label>
            <ScrollArea className="h-64 w-full rounded-md border">
                <div className="p-4 space-y-4">
                    {items.map(item => (
                        <div key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 border-b pb-2 last:border-b-0">
                            <p className="flex-1 text-sm font-medium">{item.productName}</p>
                            <div className="flex items-center gap-2 ml-auto">
                                <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => handleItemChange(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 text-center"
                                />
                                <span className="text-xs text-muted-foreground">x</span>
                                <Input
                                    type="number"
                                    value={item.price}
                                    onChange={e => handleItemChange(item.productId, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-24 h-8 text-right"
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleItemRemove(item.productId)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Produk
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari produk..." />
                                <CommandList>
                                <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                    {products.map((product) => (
                                    <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => handleAddProduct(product)}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", items.some(i => i.productId === product.id) ? "opacity-100" : "opacity-0")} />
                                        {product.name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </ScrollArea>
        </div>

        <div className="space-y-2 rounded-md border p-4">
            <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span>Diskon ({discountPercentage.toFixed(1)}%)</span>
                <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
                <span>Total Akhir</span>
                <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
                <span>Perkiraan Keuntungan</span>
                <span>{formatCurrency(profit)}</span>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading} onClick={handleSubmit}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
