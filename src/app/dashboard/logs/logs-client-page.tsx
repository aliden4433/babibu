'use client';

import { useMemo } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { User, Clock } from 'lucide-react';
import type { ActivityLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogsClientPageProps {
  initialLogs: ActivityLog[];
}

export function LogsClientPage({ initialLogs }: LogsClientPageProps) {
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: ActivityLog[] } = {};
    initialLogs.forEach((log) => {
      const date = format(parseISO(log.timestamp), 'eeee, d MMMM yyyy', {
        locale: id,
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    return groups;
  }, [initialLogs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Aktivitas</CardTitle>
        <CardDescription>
          Catatan semua aktivitas penting yang terjadi di aplikasi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {initialLogs.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-center text-muted-foreground">
            <p>Belum ada aktivitas yang tercatat.</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <div className="space-y-8 pr-4">
              {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-background py-2">{date}</h3>
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4">
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary flex-shrink-0">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm">
                            <span className="font-semibold">{log.user.email}</span>{' '}
                            {log.details}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(log.timestamp), 'HH:mm:ss')}
                            {' - '}
                            {formatDistanceToNow(parseISO(log.timestamp), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
