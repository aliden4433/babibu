
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { addExpense, updateExpense } from "./actions";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { logActivity } from "../logs/actions";

const formSchema = z.object({
  description: z.string().min(1, "Deskripsi tidak boleh kosong."),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0."),
  category: z.string({ required_error: "Harap pilih kategori." }).min(1, "Harap pilih kategori."),
  date: z.date({
    required_error: "Tanggal tidak boleh kosong.",
  }),
});

interface ExpenseFormDialogProps {
  expense?: Expense;
  children?: React.ReactNode;
  categories: ExpenseCategoryDoc[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExpenseFormDialog({ expense, children, categories, open: openProp, onOpenChange: onOpenChangeProp }: ExpenseFormDialogProps) {
  // Allow component to be controlled or uncontrolled
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChangeProp !== undefined ? onOpenChangeProp : setInternalOpen;
  
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!expense;

  const defaultCategory = categories.length > 0 ? categories[0].name : "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: defaultCategory,
      date: new Date(),
    },
  });

  const watchedCategory = form.watch("category");
  const watchedDescription = form.watch("description");

  const descriptionOptions = useMemo(() => {
    const selectedCat = categories.find(c => c.name === watchedCategory);
    return selectedCat?.descriptions || [];
  }, [watchedCategory, categories]);

  useEffect(() => {
    if (open) {
      if (isEditMode && expense) {
        form.reset({
            ...expense,
            date: new Date(expense.date),
        });
      } else {
        form.reset({
          description: "",
          amount: 0,
          category: defaultCategory,
          date: new Date(),
        });
      }
    }
  }, [expense, isEditMode, open, form, defaultCategory]);

  useEffect(() => {
    if (!isEditMode && open) { // Only auto-fill on create mode
      const selectedCat = categories.find(c => c.name === watchedCategory);
      if (selectedCat?.descriptions && selectedCat.descriptions.length > 0) {
        form.setValue("description", selectedCat.descriptions[0]);
      } else {
        form.setValue("description", ""); // Clear if category has no descriptions
      }
    }
  }, [watchedCategory, isEditMode, open, categories, form]);

  useEffect(() => {
    // Only auto-fill price on create mode and when description changes
    if (!isEditMode && open && watchedDescription) {
      const descriptionLower = watchedDescription.toLowerCase();
      if (descriptionLower.includes("lakban")) {
        form.setValue("amount", 45000);
      } else if (descriptionLower.includes("thermal")) {
        form.setValue("amount", 17000);
      }
    }
  }, [watchedDescription, isEditMode, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      let result;
      
      if (isEditMode && expense?.id) {
        const expenseData = {
          description: values.description,
          amount: values.amount,
          category: values.category,
          date: values.date.toISOString(),
        };
        result = await updateExpense(expense.id, expenseData);
      } else {
        if (!user) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Sesi Anda telah berakhir. Silakan login kembali.",
          });
          setIsLoading(false);
          return;
        }
        const expenseData = {
          description: values.description,
          amount: values.amount,
          category: values.category,
          date: values.date.toISOString(),
          recordedBy: {
            email: user.email,
            uid: user.uid,
          },
        };
        result = await addExpense(expenseData);
      }

      if (result.success) {
        if (user) {
          const action = isEditMode ? 'UPDATE_EXPENSE' : 'CREATE_EXPENSE';
          const details = isEditMode
            ? `memperbarui pengeluaran "${values.description}".`
            : `menambahkan pengeluaran baru "${values.description}" sejumlah ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(values.amount)}.`;
          await logActivity(user, action, details);
        }
        toast({
          title: "Sukses",
          description: result.message,
        });
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Perbarui detail pengeluaran di bawah ini." : "Isi detail untuk pengeluaran baru."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah (Rp)</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="e.g., Pembelian stok kopi" 
                        {...field}
                        className={cn(descriptionOptions.length > 0 && "pr-8")}
                      />
                    </FormControl>
                    {descriptionOptions.length > 0 && (
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {descriptionOptions.map((desc, index) => (
                            <DropdownMenuItem 
                              key={index}
                              onSelect={() => form.setValue("description", desc)}
                            >
                              {desc}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Pengeluaran</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "d MMMM yyyy", { locale: id })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                {isEditMode ? "Simpan Perubahan" : "Simpan Pengeluaran"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
