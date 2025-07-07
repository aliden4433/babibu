
"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Tag, MoreVertical, Play, StopCircle, Trash2, Pencil, Copy, Loader2 } from 'lucide-react';

import type { ScheduledDiscount } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { activateDiscount, deactivateDiscount, deleteScheduledDiscount, duplicateScheduledDiscount } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '../logs/actions';

interface DiscountCampaignCardProps {
  discount: ScheduledDiscount;
  onEdit: (discount: ScheduledDiscount) => void;
}

export function DiscountCampaignCard({ discount, onEdit }: DiscountCampaignCardProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleActivate = async () => {
        setIsLoading(true);
        const result = await activateDiscount(discount.id!);
        if (result.success) {
            if (user) {
              await logActivity(user, 'ACTIVATE_DISCOUNT', `mengaktifkan jadwal diskon "${discount.name}".`);
            }
            toast({ title: 'Sukses', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsLoading(false);
    };

    const handleDeactivate = async () => {
        setIsLoading(true);
        const result = await deactivateDiscount(discount.id!);
        if (result.success) {
            if (user) {
              await logActivity(user, 'DEACTIVATE_DISCOUNT', `menonaktifkan jadwal diskon "${discount.name}".`);
            }
            toast({ title: 'Sukses', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        const result = await deleteScheduledDiscount(discount.id!);
        if (result.success) {
            if (user) {
              await logActivity(user, 'DELETE_DISCOUNT', `menghapus jadwal diskon "${discount.name}".`);
            }
            toast({ title: 'Sukses', description: result.message });
            setIsDeleteDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsLoading(false);
    };

    const handleDuplicate = async () => {
        setIsDuplicating(true);
        const result = await duplicateScheduledDiscount(discount.id!);
        if (result.success) {
            if (user) {
              await logActivity(user, 'DUPLICATE_DISCOUNT', `menduplikasi jadwal diskon "${discount.name}".`);
            }
            toast({ title: 'Sukses', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsDuplicating(false);
    };

    const getStatus = () => {
        const now = new Date();
        const start = new Date(discount.startDate);
        const end = new Date(discount.endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        if (discount.isActive) return { text: 'Aktif', color: 'bg-green-500' };
        if (now > end) return { text: 'Selesai', color: 'bg-gray-500' };
        if (now < start) return { text: 'Terjadwal', color: 'bg-blue-500' };
        return { text: 'Siap Diaktifkan', color: 'bg-yellow-500' };
    };

    const status = getStatus();

    const startDateFmt = format(new Date(discount.startDate), 'd MMM yyyy', { locale: id });
    const endDateFmt = format(new Date(discount.endDate), 'd MMM yyyy', { locale: id });
    const displayDate = startDateFmt === endDateFmt ? startDateFmt : `${startDateFmt} - ${endDateFmt}`;

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{discount.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1">
                            <Calendar className="h-4 w-4" />
                            <span>{displayDate}</span>
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => onEdit(discount)}>
                               <Pencil className="mr-2 h-4 w-4"/> Edit
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                               {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Copy className="mr-2 h-4 w-4"/>}
                               Duplikat
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                               <Trash2 className="mr-2 h-4 w-4"/> Hapus
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{discount.products.length} produk termasuk</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                    <span>Status: {status.text}</span>
                </div>
            </CardContent>
            <CardFooter>
                {discount.isActive ? (
                    <Button variant="outline" className="w-full" onClick={handleDeactivate} disabled={isLoading}>
                        <StopCircle className="mr-2 h-4 w-4" />
                        {isLoading ? 'Menonaktifkan...' : 'Nonaktifkan'}
                    </Button>
                ) : (
                    <Button className="w-full" onClick={handleActivate} disabled={isLoading || status.text === 'Selesai'}>
                        <Play className="mr-2 h-4 w-4" />
                        {isLoading ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}
                    </Button>
                )}
            </CardFooter>
        </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Jadwal diskon "{discount.name}" akan dihapus permanen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                        {isLoading ? "Menghapus..." : "Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
