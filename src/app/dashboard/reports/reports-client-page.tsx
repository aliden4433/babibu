"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import type { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon, DollarSign, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react"

import type { Product, Sale, SaleItem, Expense } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BestsellersChart } from "./charts"

interface ReportsClientPageProps {
  initialSales: Sale[]
  products: Product[]
  initialExpenses: Expense[]
}

export function ReportsClientPage({ initialSales, products, initialExpenses }: ReportsClientPageProps) {
  const [date, setDate] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setDate({
      from: firstDayOfMonth,
      to: today,
    });
  }, [])

  const filteredSales = useMemo(() => {
    if (!date?.from) return []

    const fromDate = date.from
    const toDate = date.to ? addDays(date.to, 1) : addDays(fromDate, 1)

    return initialSales.filter(sale => {
      const saleDate = new Date(sale.date)
      return saleDate >= fromDate && saleDate < toDate
    })
  }, [initialSales, date])
  
  const filteredExpenses = useMemo(() => {
    if (!date?.from) return []
    
    const fromDate = date.from
    const toDate = date.to ? addDays(date.to, 1) : addDays(fromDate, 1)

    return initialExpenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= fromDate && expenseDate < toDate
    })
  }, [initialExpenses, date])

  const { revenue, count, netProfit, totalExpenses } = useMemo(() => {
    const revenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0)
    const salesProfit = filteredSales.reduce((acc, sale) => acc + (sale.profit || 0), 0)
    const count = filteredSales.length
    const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0)
    
    // Net Profit is calculated by subtracting total expenses from the profit made on sales.
    const netProfit = salesProfit - totalExpenses
    
    return { revenue, count, netProfit, totalExpenses }
  }, [filteredSales, filteredExpenses])
  
  const bestsellers = useMemo(() => {
    const itemCounts: { [key: string]: number } = {}
    filteredSales.forEach(sale => {
      sale.items.forEach((item: SaleItem) => {
        if (itemCounts[item.productName]) {
          itemCounts[item.productName] += item.quantity
        } else {
          itemCounts[item.productName] = item.quantity
        }
      })
    })

    return Object.entries(itemCounts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filteredSales])


  const allTimeSalesCount = initialSales.length;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
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
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(revenue)}
            </div>
            <p className="text-xs text-muted-foreground">dari {count} penjualan di periode ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Total pengeluaran di periode ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-xl font-bold",
              netProfit < 0 && "text-destructive"
            )}>
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Pendapatan dikurangi pengeluaran</p>
          </CardContent>
        </Card>
        <Link href="/dashboard/sales-history" className="block">
          <Card className="hover:bg-accent transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{allTimeSalesCount}</div>
              <p className="text-xs text-muted-foreground">Total transaksi (semua waktu)</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Produk dalam katalog</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Terlaris (Periode Dipilih)</CardTitle>
        </CardHeader>
        <CardContent>
          {bestsellers.length > 0 ? (
            <BestsellersChart data={bestsellers} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
                Tidak ada data penjualan untuk periode yang dipilih.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
