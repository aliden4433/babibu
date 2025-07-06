
"use client"

import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Monitor, Moon, Sun, AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { resetAllData } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { logActivity } from "../logs/actions"

const discountFormSchema = z.object({
  discount: z.coerce
    .number()
    .min(0, "Diskon tidak boleh negatif.")
    .max(100, "Diskon tidak boleh lebih dari 100."),
})

export function GeneralSettings() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [mounted, setMounted] = useState(false)
  const [defaultDiscount, setDefaultDiscount] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedDiscount = localStorage.getItem("defaultDiscount")
    if (savedDiscount) {
      const parsedDiscount = parseFloat(savedDiscount)
      if (!isNaN(parsedDiscount)) {
        setDefaultDiscount(parsedDiscount)
      }
    }
  }, [])

  const discountForm = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    values: {
      discount: defaultDiscount,
    },
  })

  useEffect(() => {
    discountForm.reset({ discount: defaultDiscount })
  }, [defaultDiscount, discountForm])

  function onDiscountSubmit(values: z.infer<typeof discountFormSchema>) {
    localStorage.setItem("defaultDiscount", values.discount.toString())
    setDefaultDiscount(values.discount)
    toast({
      title: "Pengaturan Disimpan",
      description: `Diskon default telah diatur ke ${values.discount}%.`,
    })
  }

  const handleResetData = async () => {
    setIsResetting(true);
    const result = await resetAllData();
    if (result.success) {
      if (user) {
        await logActivity(user, 'RESET_DATA', 'mereset semua data aplikasi.');
      }
      toast({ title: "Sukses", description: result.message });
      setIsResetAlertOpen(false);
      // Optional: you might want to force a reload to reflect the empty state
      window.location.reload();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsResetting(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>
            Sesuaikan tampilan aplikasi agar sesuai dengan preferensi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
            </div>
          ) : (
            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <div>
                  <Label className="cursor-pointer">
                    <RadioGroupItem value="light" className="sr-only" />
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:border-primary data-[state=checked]:border-primary">
                        <Sun className="h-6 w-6 mb-2" />
                        Terang
                    </div>
                  </Label>
                </div>
                 <div>
                  <Label className="cursor-pointer">
                    <RadioGroupItem value="dark" className="sr-only" />
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:border-primary data-[state=checked]:border-primary">
                        <Moon className="h-6 w-6 mb-2" />
                        Gelap
                    </div>
                  </Label>
                </div>
                 <div>
                  <Label className="cursor-pointer">
                    <RadioGroupItem value="system" className="sr-only" />
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:border-primary data-[state=checked]:border-primary">
                        <Monitor className="h-6 w-6 mb-2" />
                        Sistem
                    </div>
                  </Label>
                </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaksi</CardTitle>
          <CardDescription>
            Atur nilai default untuk transaksi penjualan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...discountForm}>
            <form onSubmit={discountForm.handleSubmit(onDiscountSubmit)} className="space-y-6">
              <FormField
                control={discountForm.control}
                name="discount"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Diskon Default (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Diskon ini akan otomatis diterapkan pada setiap transaksi baru.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Simpan Diskon</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>
            Anda saat ini login sebagai pengguna berikut.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4 max-w-sm">
             <div>
                <Label>Email Pengguna</Label>
                <p className="text-sm font-medium text-muted-foreground">{user?.email || 'Memuat...'}</p>
             </div>
              <div>
                <Label>Peran</Label>
                {user?.role && (
                   <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                     {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                   </Badge>
                )}
             </div>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Reset Data Aplikasi</CardTitle>
          <CardDescription>
            Tindakan ini akan menghapus semua data transaksi, produk, dan pengaturan secara permanen. Tindakan ini tidak dapat dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setIsResetAlertOpen(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Reset Semua Data
          </Button>
        </CardContent>
      </Card>
       <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus semua data produk, riwayat penjualan, pengeluaran, jadwal diskon, dan kategori secara permanen. Data yang sudah dihapus tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              disabled={isResetting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Semua Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
