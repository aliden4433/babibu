
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart2, History, LogOut, Package, ShoppingCart, UserCircle, PanelLeft, Settings, Wallet, PanelLeftClose, PanelLeftOpen, Tag } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

const allNavItems = [
  { href: "/dashboard", icon: ShoppingCart, label: "Penjualan" },
  { href: "/dashboard/products", icon: Package, label: "Produk" },
  { href: "/dashboard/discounts", icon: Tag, label: "Diskon Produk", roles: ["admin"] },
  { href: "/dashboard/sales-history", icon: History, label: "Riwayat Penjualan" },
  { href: "/dashboard/expenses", icon: Wallet, label: "Pengeluaran", roles: ["admin", "cashier"] },
  { href: "/dashboard/reports", icon: BarChart2, label: "Laporan", roles: ["admin"] },
  { href: "/dashboard/settings", icon: Settings, label: "Pengaturan", roles: ["admin"] },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { toggleSidebar, state, isMobile } = useSidebar()
  const { user, signOut } = useAuth()

  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true; // Accessible to all roles if not specified
    if (!user || !user.role) return false; // Hide role-specific items if user/role is not loaded
    return item.roles.includes(user.role);
  });

  const currentPage = navItems.find(item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Icons.logo className="size-8" />
            <span className="text-lg font-semibold text-primary-foreground group-data-[collapsible=icon]:hidden">
              Kasir Kilat
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={user?.email || "Akun"}>
                <UserCircle />
                <span className="truncate">{user?.email || "Pengguna"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="hidden md:block">
              <SidebarMenuButton onClick={toggleSidebar} tooltip="Sembunyikan">
                <PanelLeftClose />
                <span>Sembunyikan</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          {state === 'collapsed' && !isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
              <PanelLeftOpen />
              <span className="sr-only">Tampilkan Sidebar</span>
            </Button>
          )}
          <h1 className="text-xl font-semibold">{currentPage?.label || ''}</h1>
        </header>
        <main className="p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}
