
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PlusCircle, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { getColumns } from "./columns";
import { DataTable } from "@/app/dashboard/products/data-table"; // Re-using the generic data table
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesByCategoryChart } from "./expense-charts";

interface ExpensesClientPageProps {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategoryDoc[];
}

export function ExpensesClientPage({ initialExpenses, initialCategories }: ExpensesClientPageProps) {
  const columns = React.useMemo(() => getColumns(initialCategories), [initialCategories]);
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      if (!prev) return undefined;
      const newDate = new Date(prev);
      newDate.setDate(1); // Set to the first day to avoid issues with month lengths
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (!prev) return undefined;
      const newDate = new Date(prev);
      newDate.setDate(1); // Set to the first day to avoid issues with month lengths
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const { monthlyTotal, displayedMonthName, filteredExpenses, expensesByCategory } = useMemo(() => {
    if (!currentDate) {
        return { monthlyTotal: 0, displayedMonthName: 'Memuat...', filteredExpenses: [], expensesByCategory: [] };
    }

    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    const displayedMonthName = format(currentDate, "MMMM yyyy", { locale: id });

    const filtered = initialExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
      });

    const total = filtered.reduce((acc, expense) => acc + expense.amount, 0);
    
    const categoryTotals: { [key: string]: number } = {};
    filtered.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const chartData = Object.entries(categoryTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    return { monthlyTotal: total, displayedMonthName, filteredExpenses: filtered, expensesByCategory: chartData };
  }, [initialExpenses, currentDate]);

  const isNextMonthDisabled = useMemo(() => {
    if (!currentDate) return true;

    const nextMonth = new Date(currentDate);
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const today = new Date();
    today.setDate(1);
    today.setHours(0,0,0,0);
    return nextMonth > today;
  }, [currentDate]);


  return (
    <div className="space-y-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(monthlyTotal)}
            </div>
             <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Bulan sebelumnya</span>
                </Button>
                <span className="font-medium">{displayedMonthName}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNextMonth} disabled={isNextMonthDisabled}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Bulan berikutnya</span>
                </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle className="text-sm font-medium">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
             <ExpensesByCategoryChart data={expensesByCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        {!isMobile && (
            <ExpenseFormDialog categories={initialCategories}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Pengeluaran
            </Button>
            </ExpenseFormDialog>
        )}
      </div>
      <DataTable
        columns={columns}
        data={filteredExpenses}
        userRole="admin"
        filterColumnId="description"
        filterPlaceholder="Filter berdasarkan deskripsi..."
        categories={initialCategories}
        entityName="pengeluaran"
      />
       {isMobile && (
         <ExpenseFormDialog categories={initialCategories}>
            <Button
                className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20"
                size="icon"
            >
                <PlusCircle className="h-7 w-7" />
                <span className="sr-only">Tambah Pengeluaran</span>
            </Button>
        </ExpenseFormDialog>
      )}
    </div>
  );
}
