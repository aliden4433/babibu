
"use client"

import { useState, useMemo, useEffect } from "react"
import { Trash2, ShoppingCart, Loader2, Calendar as CalendarIcon, ChevronDown, PlusCircle } from "lucide-react"
import { format } from "date-fns"

import { addSale } from "./sales/actions"
import type { CartItem, Product, Sale, ExpenseCategoryDoc } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { ProductVariantDialog } from "./sales/product-variant-dialog"
import { ExpenseFormDialog } from "@/app/dashboard/expenses/expense-form-dialog"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/hooks/use-auth"
import { logActivity } from "./logs/actions"

interface SalesClientPageProps {
  products: Product[]
  sales: Sale[]
  categories: ExpenseCategoryDoc[],
  defaultDiscount: number,
}

export function SalesClientPage({ products, sales, categories, defaultDiscount }: SalesClientPageProps) {
  const {
    storedCart,
    addToCart: contextAddToCart,
    updateQuantity,
    updatePrice,
    removeFromCart,
    clearCart,
    totalItemsInCart,
    isCartLoaded,
  } = useCart();
  const { user } = useAuth();

  const [discount, setDiscount] = useState(defaultDiscount) // Percentage
  const [transactionDate, setTransactionDate] = useState<Date>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("name-asc")
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [variantSelection, setVariantSelection] = useState<Product[] | null>(null)

  useEffect(() => {
    setTransactionDate(new Date());
    setDiscount(defaultDiscount);
  }, [defaultDiscount]);

  const cart: CartItem[] = useMemo(() => {
    if (!isCartLoaded) return [];
    return storedCart.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null; // Product might have been deleted
        return { product, quantity: item.quantity, price: item.price };
    }).filter((item): item is CartItem => item !== null);
  }, [storedCart, products, isCartLoaded]);

  const salesCount = useMemo(() => {
    const counts: { [key: string]: number } = {};
    if (!sales) return counts;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.productId) {
          counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
        }
      });
    });
    return counts;
  }, [sales]);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortOrder) {
          case "name-asc":
            return a.name.localeCompare(b.name)
          case "name-desc":
            return b.name.localeCompare(a.name)
          case "price-asc":
            return a.price - b.price
          case "price-desc":
            return b.price - a.price
          case "bestsellers":
            return (salesCount[b.id!] || 0) - (salesCount[a.id!] || 0)
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [products, searchTerm, sortOrder, salesCount])
  
  const productGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredAndSortedProducts.forEach(p => {
      const nameParts = p.name.split(" - ");
      const baseName = nameParts[0].trim();
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(p);
    });
    return Object.values(groups);
  }, [filteredAndSortedProducts]);


  const addToCart = (product: Product, quantity: number = 1, showToast = true) => {
    contextAddToCart(product, quantity);
    if (showToast) {
      toast({
        title: "Produk Ditambahkan",
        description: `${product.name} telah ditambahkan ke keranjang.`,
      })
    }
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  async function handleProcessSale() {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Keranjang Kosong",
        description: "Tidak ada item untuk diproses.",
      })
      return
    }

    if (!transactionDate) {
      toast({
        variant: "destructive",
        title: "Tanggal Tidak Valid",
        description: "Harap pilih tanggal transaksi.",
      });
      return;
    }

    setIsProcessing(true)

    const saleData = {
      items: cart,
      discountPercentage: discount,
      transactionDate: transactionDate.toISOString(),
    }

    try {
      const result = await addSale(saleData)
      if (result.success) {
        if (user) {
          await logActivity(user, 'CREATE_SALE', `mencatat transaksi baru senilai ${formatCurrency(total)}.`);
        }
        toast({
          title: "Transaksi Berhasil",
          description: result.message,
        })
        clearCart()
        setDiscount(defaultDiscount)
        setTransactionDate(new Date())
      } else {
        toast({
          variant: "destructive",
          title: "Error Transaksi",
          description: result.message,
        })
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan yang tidak terduga saat memproses transaksi.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const CartTrigger = (
    <Button
      className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20 md:hidden"
      size="icon"
    >
      <ShoppingCart className="h-7 w-7" />
      <span className="sr-only">Keranjang Belanja</span>
      {totalItemsInCart > 0 && (
        <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full">
          {totalItemsInCart}
        </Badge>
      )}
    </Button>
  );

  const CartItems = (
    <div className="flex-grow overflow-y-auto">
      <div className="p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
            <ShoppingCart className="w-12 h-12 mb-4" />
            <p className="font-semibold">Keranjang Anda kosong.</p>
            <p className="text-sm">Klik produk untuk menambahkannya.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => {
              const isDiscounted = item.product.originalPrice && item.product.originalPrice > item.price;
              return (
              <div key={item.product.id} className="space-y-2 border-b border-border pb-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                   <div>
                      <p className="text-sm font-medium break-words flex-grow pr-2">{item.product.name}</p>
                      {isDiscounted && <Badge variant="destructive" className="mt-1 text-xs">SALE</Badge>}
                    </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-1 -mr-2" onClick={() => removeFromCart(item.product.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`price-${item.product.id}`} className="text-xs text-muted-foreground">Harga</Label>
                    <Input
                      id={`price-${item.product.id}`}
                      type="number"
                      value={item.price}
                      onChange={(e) => updatePrice(item.product.id!, parseFloat(e.target.value))}
                      className="w-28 h-9 text-sm"
                      step="1000"
                    />
                  </div>
                   <div className="grid gap-1.5">
                    <Label htmlFor={`qty-${item.product.id}`} className="text-xs text-muted-foreground">Jumlah</Label>
                    <Input
                      id={`qty-${item.product.id}`}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id!, parseInt(e.target.value))}
                      className="w-20 h-9 text-center text-sm"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );

  const CartSummary = (
    <>
      {cart.length > 0 && (
        <>
          <Separator />
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Tanggal Transaksi</p>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            size="sm"
                            className={cn(
                                "w-auto justify-start text-left font-normal",
                                !transactionDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {transactionDate ? format(transactionDate, "dd MMM yyyy") : <span>Pilih</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={transactionDate}
                            onSelect={(date) => setTransactionDate(date || new Date())}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>{formatCurrency(total)}</p>
            </div>
          </div>
          <CardFooter className="p-4 pt-0">
             <Button className="w-full" onClick={handleProcessSale} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isProcessing ? "Memproses..." : `Catat Transaksi (${formatCurrency(total)})`}
              </Button>
          </CardFooter>
        </>
      )}
    </>
  );

  const CartPanel = (
    <Card className="sticky top-6 flex flex-col max-h-[calc(100vh-3rem)]">
        <CardHeader>
            <CardTitle>Pesanan Saat Ini</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
            {CartItems}
        </CardContent>
        <div className="mt-auto">
          {CartSummary}
        </div>
    </Card>
  )

  if (isMobile === undefined) {
    return (
       <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
         <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
           <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <ExpenseFormDialog categories={categories}>
                    <Button variant="outline" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Pengeluaran
                    </Button>
                </ExpenseFormDialog>
            </div>
            <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
            />
            <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Harga (Rendah ke Tinggi)</SelectItem>
                    <SelectItem value="price-desc">Harga (Tinggi ke Rendah)</SelectItem>
                    <SelectItem value="bestsellers">Produk Terlaris</SelectItem>
                </SelectContent>
            </Select>

             <div className="divide-y divide-border rounded-md border">
                {productGroups.length > 0 ? (
                productGroups.map((group, index) => {
                  const product = group[0];
                  const baseName = product.name.split(" - ")[0].trim();
                  const hasVariants = group.length > 1;
                  const isDiscounted = !hasVariants && product.originalPrice && product.originalPrice > product.price;

                  const handleClick = () => {
                    if (hasVariants) {
                      setVariantSelection(group);
                    } else {
                      addToCart(product, 1);
                    }
                  };

                  return (
                    <button
                      key={`${baseName}-${index}`}
                      onClick={handleClick}
                      className="w-full text-left p-4 hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring focus:z-10 transition-colors first:rounded-t-md last:rounded-b-md"
                      aria-label={`Pilih produk ${baseName}`}
                    >
                        <div className="flex justify-between items-start gap-4">
                             <p className="font-medium text-sm pr-2 break-words flex-1">{baseName}</p>
                             <div className="flex-shrink-0 text-right">
                                {hasVariants ? (
                                    <Badge variant="outline" className="h-6">
                                      {group.length} Varian
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </Badge>
                                ) : (
                                    <div className="text-sm font-semibold text-foreground">
                                        {isDiscounted ? (
                                            <div className="flex flex-col items-end">
                                               <span>{formatCurrency(product.price)}</span>
                                               <span className="text-muted-foreground line-through font-normal text-xs">{formatCurrency(product.originalPrice!)}</span>
                                            </div>
                                        ) : (
                                            <span>{formatCurrency(product.price)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="text-xs text-muted-foreground mt-2 flex flex-col items-start text-left">
                           <div className="flex justify-between w-full">
                             <span>Stok:</span>
                             <span>{group.reduce((total, p) => total + p.stock, 0)}</span>
                           </div>
                           {isDiscounted && <Badge variant="destructive" className="mt-1 text-xs">SALE</Badge>}
                        </div>
                    </button>
                  );
                })
                ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>Tidak ada produk yang cocok.</p>
                    </div>
                )}
            </div>
        </div>

        <Drawer>
          <DrawerTrigger asChild>
            <Button
              className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20 md:hidden"
              size="icon"
            >
              <ShoppingCart className="h-7 w-7" />
              <span className="sr-only">Keranjang Belanja</span>
              {totalItemsInCart > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full">
                  {totalItemsInCart}
                </Badge>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-0 flex flex-col h-[90vh]">
            <DrawerHeader className="p-4 pb-2 border-b text-left">
              <DrawerTitle>Pesanan Saat Ini</DrawerTitle>
            </DrawerHeader>
            {CartItems}
            <div className="mt-auto">
              {CartSummary}
            </div>
          </DrawerContent>
        </Drawer>
        
        <ProductVariantDialog
          productGroup={variantSelection}
          open={!!variantSelection}
          onOpenChange={() => setVariantSelection(null)}
          onAddToCart={addToCart}
        />
      </>
    )
  }

  return (
    <div className="grid md:grid-cols-[1fr_420px] gap-8 items-start">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Produk</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <ExpenseFormDialog categories={categories}>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Pengeluaran
                    </Button>
                </ExpenseFormDialog>
                <Input
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64"
                />
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                        <SelectItem value="price-asc">Harga (Rendah ke Tinggi)</SelectItem>
                        <SelectItem value="price-desc">Harga (Tinggi ke Rendah)</SelectItem>
                        <SelectItem value="bestsellers">Produk Terlaris</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t flex-grow">
          <div className="divide-y divide-border h-full max-h-[calc(100vh-14rem)] overflow-y-auto">
            {productGroups.length > 0 ? (
              productGroups.map((group, index) => {
                  const product = group[0];
                  const baseName = product.name.split(" - ")[0].trim();
                  const hasVariants = group.length > 1;
                  const isDiscounted = !hasVariants && product.originalPrice && product.originalPrice > product.price;

                  const handleClick = () => {
                    if (hasVariants) {
                      setVariantSelection(group);
                    } else {
                      addToCart(product, 1);
                    }
                  };

                  return (
                    <button
                      key={`${baseName}-${index}`}
                      onClick={handleClick}
                      className="w-full text-left p-4 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset transition-colors"
                      aria-label={`Pilih produk ${baseName}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-grow pr-4">
                                <p className="font-medium text-sm truncate">{baseName}</p>
                                {isDiscounted && <Badge variant="destructive" className="mt-1 text-xs">SALE</Badge>}
                            </div>
                            <div className="flex-shrink-0 text-right">
                                {hasVariants ? (
                                    <Badge variant="outline">{group.length} Varian</Badge>
                                ) : (
                                    <div className="text-sm font-semibold text-foreground">
                                      {isDiscounted ? (
                                        <div className="flex items-baseline gap-2">
                                          <span>{formatCurrency(product.price)}</span>
                                          <span className="text-muted-foreground line-through font-normal text-xs">{formatCurrency(product.originalPrice!)}</span>
                                        </div>
                                      ) : (
                                        <span>{formatCurrency(product.price)}</span>
                                      )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            <p>
                              Stok Total: {group.reduce((total, p) => total + p.stock, 0)}
                            </p>
                      </div>
                    </button>
                  );
                })
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Tidak ada produk yang cocok dengan pencarian Anda.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {CartPanel}

      <ProductVariantDialog
        productGroup={variantSelection}
        open={!!variantSelection}
        onOpenChange={() => setVariantSelection(null)}
        onAddToCart={addToCart}
      />
    </div>
  )
}
