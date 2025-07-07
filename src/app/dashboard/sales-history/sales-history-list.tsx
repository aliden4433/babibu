
"use client"

import { useState, useMemo, useEffect } from "react";
import type { Sale, Expense, Product } from "@/lib/types";
import { format, addDays, subDays } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReceiptText, Trash2, Loader2, Calendar as CalendarIcon, ChevronDown, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { deleteSales, deleteSale } from "./actions";
import { ExportSalesButton } from "./export-sales-button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { SaleEditDialog } from "./sale-edit-dialog";

interface SalesHistoryListProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
}

export function SalesHistoryList({ sales: initialSales, expenses: initialExpenses, products }: SalesHistoryListProps) {
  const [sales, setSales] = useState(initialSales);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [salesForDeletion, setSalesForDeletion] = useState<Sale[]>([]);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = user?.role;
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    // Default to last 30 days, set on client to avoid hydration errors.
    setDate({
      from: subDays(new Date(), 29),
      to: new Date(),
    })
  }, [])
  
  const filteredSales = useMemo(() => {
    if (!date?.from) return [];

    const fromDate = new Date(date.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = date.to ? new Date(date.to) : new Date(date.from);
    toDate.setHours(23, 59, 59, 999);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= fromDate && saleDate <= toDate;
    });
  }, [sales, date]);

  const filteredExpenses = useMemo(() => {
    if (!date?.from) return [];

    const fromDate = new Date(date.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = date.to ? new Date(date.to) : new Date(date.from);
    toDate.setHours(23, 59, 59, 999);

    return initialExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= fromDate && expenseDate <= toDate;
    });
  }, [initialExpenses, date]);


  // Clear selections when filter changes
  useEffect(() => {
    setSelectedSales([]);
  }, [date]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleDeleteRequest = (salesToDelete: Sale[]) => {
    if (userRole !== 'admin' || salesToDelete.length === 0) return;
    setSalesForDeletion(salesToDelete);
  };
  
  const handleEditRequest = (sale: Sale) => {
    if (userRole !== 'admin') return;
    setSaleToEdit(sale);
  };
  
  const handleSaleUpdate = (updatedSale: Sale) => {
    setSales(currentSales =>
      currentSales.map(s => (s.id === updatedSale.id ? updatedSale : s))
    );
  };

  const handleConfirmDelete = async () => {
    if (salesForDeletion.length === 0) return;
    setIsDeleting(true);
    try {
      const result = salesForDeletion.length === 1 
        ? await deleteSale(salesForDeletion[0]) 
        : await deleteSales(salesForDeletion);
        
      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        });
        const idsToDelete = new Set(salesForDeletion.map(s => s.id));
        setSales(currentSales => currentSales.filter(s => !idsToDelete.has(s.id)));
        setSalesForDeletion([]);
        setSelectedSales([]);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus transaksi.",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSalesForDeletion([]);
    }
  };

  const handleSelectSale = (saleId: string, checked: boolean) => {
    setSelectedSales(prev => {
        if (checked) {
            return [...prev, saleId];
        } else {
            return prev.filter(id => id !== saleId);
        }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedSales(filteredSales.map(s => s.id));
    } else {
        setSelectedSales([]);
    }
  };


  if (initialSales.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground flex flex-col items-center gap-4">
          <ReceiptText className="w-16 h-16" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Belum ada riwayat penjualan.</p>
            <p>Selesaikan transaksi di halaman Penjualan untuk melihat riwayat di sini.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Riwayat Transaksi</CardTitle>
                <CardDescription>
                  Berikut adalah daftar transaksi yang telah tercatat.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[260px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "d MMM yyyy", { locale: id })} -{" "}
                              {format(date.to, "d MMM yyyy", { locale: id })}
                            </>
                          ) : (
                            format(date.from, "d MMM yyyy", { locale: id })
                          )
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row" align="end">
                       <div className="flex flex-col space-y-1 p-2 border-b sm:border-r sm:border-b-0">
                            <Button variant="ghost" className="justify-start w-full text-left font-normal" onClick={() => setDate({from: new Date(), to: new Date()})}>Hari ini</Button>
                            <Button variant="ghost" className="justify-start w-full text-left font-normal" onClick={() => setDate({from: subDays(new Date(), 1), to: subDays(new Date(), 1)})}>Kemarin</Button>
                            <Button variant="ghost" className="justify-start w-full text-left font-normal" onClick={() => setDate({from: subDays(new Date(), 6), to: new Date()})}>7 hari terakhir</Button>
                            <Button variant="ghost" className="justify-start w-full text-left font-normal" onClick={() => setDate({from: subDays(new Date(), 13), to: new Date()})}>14 hari terakhir</Button>
                            <Button variant="ghost" className="justify-start w-full text-left font-normal" onClick={() => setDate({from: subDays(new Date(), 29), to: new Date()})}>30 hari terakhir</Button>
                        </div>
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  {userRole === 'admin' && <ExportSalesButton sales={filteredSales} expenses={filteredExpenses} />}
              </div>
          </div>
        </CardHeader>
         {userRole === 'admin' && (
            <div className="px-6 pb-4 border-t border-b">
                <div className="flex items-center gap-4 h-9">
                    <Checkbox
                        id="select-all"
                        checked={filteredSales.length > 0 && selectedSales.length === filteredSales.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Pilih semua"
                        disabled={filteredSales.length === 0}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-muted-foreground select-none">
                       {selectedSales.length > 0 ? `${selectedSales.length} dipilih` : 'Pilih semua'}
                    </label>
                    {selectedSales.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="ml-auto"
                            onClick={() => handleDeleteRequest(sales.filter(s => selectedSales.includes(s.id)))}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus ({selectedSales.length})
                        </Button>
                    )}
                </div>
            </div>
        )}
        <CardContent className="pt-4">
          {filteredSales.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredSales.map((sale) => (
                  <AccordionItem value={sale.id} key={sale.id} className="border-b-0 rounded-lg border overflow-hidden bg-card">
                    <div className="flex w-full items-center group transition-colors hover:bg-accent/50 data-[state=open]:bg-accent/50">
                      {userRole === 'admin' && (
                        <div className="pl-4 pr-2 sm:pr-4">
                          <Checkbox
                            checked={selectedSales.includes(sale.id)}
                            onCheckedChange={(checked) => handleSelectSale(sale.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Pilih transaksi ${sale.transactionId}`}
                          />
                        </div>
                      )}
                      <AccordionPrimitive.Header className="flex-grow">
                          <AccordionPrimitive.Trigger className={cn("flex w-full flex-1 items-center justify-between p-4 font-medium text-left", userRole !== 'admin' && "pl-4", "hover:no-underline focus:outline-none")}>
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <p className="font-semibold">{sale.transactionId || 'No ID'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(sale.date), "d MMM yyyy, HH:mm", { locale: id })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-base text-primary">{formatCurrency(sale.total)}</p>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                          </AccordionPrimitive.Trigger>
                      </AccordionPrimitive.Header>
                      {userRole === 'admin' && (
                        <div className="pr-4 flex items-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleEditRequest(sale); }}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit Transaksi</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteRequest([sale]); }}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Hapus Transaksi</span>
                            </Button>
                        </div>
                      )}
                    </div>
                    <AccordionContent className="px-4 pt-2 pb-4 bg-secondary/30 border-t">
                      <div className="space-y-3 pt-3">
                        {sale.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-muted-foreground">
                                {item.quantity} x {formatCurrency(item.price)}
                              </p>
                            </div>
                            <p className="font-medium">
                              {formatCurrency(item.quantity * item.price)}
                            </p>
                          </div>
                        ))}
                        <Separator className="my-2 bg-border/80" />
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <p>Subtotal</p>
                            <p>{formatCurrency(sale.subtotal)}</p>
                          </div>
                           <div className="flex justify-between text-sm">
                            <p>Diskon</p>
                            <p className="text-destructive">-{formatCurrency(sale.discount)}</p>
                          </div>
                        </div>
                        <Separator className="my-2 bg-border/80" />
                        <div className="flex justify-between font-semibold text-base">
                          <p>Total</p>
                          <p>{formatCurrency(sale.total)}</p>
                        </div>
                        {userRole === 'admin' && sale.profit !== undefined && (
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-500 pt-1">
                                <p className="font-medium">Keuntungan</p>
                                <p className="font-medium">{formatCurrency(sale.profit)}</p>
                            </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
          ) : (
             <div className="text-center text-muted-foreground py-10">
                <p>Tidak ada transaksi untuk rentang tanggal yang dipilih.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={salesForDeletion.length > 0} onOpenChange={handleDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus {salesForDeletion.length} transaksi penjualan dan mengembalikan stok produk yang terjual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Menghapus..." : "Hapus Transaksi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <SaleEditDialog
        open={!!saleToEdit}
        onOpenChange={(open) => !open && setSaleToEdit(null)}
        sale={saleToEdit}
        products={products}
        onSuccess={handleSaleUpdate}
      />
    </>
  );
}
