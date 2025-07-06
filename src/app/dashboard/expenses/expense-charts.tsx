"use client"

import { useMemo } from "react"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Card, CardContent } from "@/components/ui/card"

interface ExpensesByCategoryChartProps {
  data: { name: string; total: number }[]
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1)/0.8)",
  "hsl(var(--chart-2)/0.8)",
  "hsl(var(--chart-3)/0.8)",
];

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: chartColors[index % chartColors.length],
    }))
  }, [data])

  const chartConfig = useMemo(() => {
    if (!chartData.length) return {};
    return chartData.reduce((acc, item) => {
      acc[item.name] = {
        label: item.name,
        color: item.fill,
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);
  
  const totalValue = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0);
  }, [data]);

  if (data.length === 0) {
    return (
        <div className="flex h-full min-h-[300px] w-full items-center justify-center p-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <p>Tidak ada data pengeluaran untuk periode ini.</p>
            </div>
        </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                hideLabel 
                formatter={(value, name) => (
                    <div className="flex flex-col gap-0.5">
                        <div className="font-medium">{name}</div>
                        <div className="text-muted-foreground">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value as number)}
                            {totalValue > 0 && <span className="ml-2 text-xs">({((value as number / totalValue) * 100).toFixed(1)}%)</span>}
                        </div>
                    </div>
                )}
            />}
          />
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="name"
            innerRadius="60%"
            outerRadius="80%"
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
