"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { StockItem } from "@/lib/krx/types";

interface TopDividendChartProps {
  data: StockItem[];
  loading: boolean;
}

function barColor(yield_: number): string {
  if (yield_ >= 5) return "#10B981";
  if (yield_ >= 3) return "#F59E0B";
  return "#3B82F6";
}

export default function TopDividendChart({
  data,
  loading,
}: TopDividendChartProps) {
  const top20 = useMemo(() => {
    return [...data]
      .filter((s) => s.dividendYield > 0)
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, 20)
      .map((s) => ({
        name: s.name.length > 8 ? s.name.slice(0, 8) + ".." : s.name,
        fullName: s.name,
        code: s.code,
        yield: s.dividendYield,
        dps: s.dps,
        price: s.closePrice,
      }));
  }, [data]);

  if (loading) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          배당수익률 Top 20
        </h3>
        <div className="h-[500px] flex items-center justify-center">
          <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (top20.length === 0) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          배당수익률 Top 20
        </h3>
        <p className="text-text-dim text-sm text-center py-8">
          배당 데이터 없음
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-4">
        배당수익률 Top 20
      </h3>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={top20}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={{ stroke: "#374151" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fill: "#D1D5DB", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#F9FAFB", fontWeight: 600 }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, "배당수익률"]}
            labelFormatter={(label: string, payload) => {
              if (payload && payload[0]) {
                const d = payload[0].payload;
                return `${d.fullName} (${d.code})`;
              }
              return label;
            }}
          />
          <Bar dataKey="yield" radius={[0, 4, 4, 0]} barSize={18}>
            {top20.map((entry, index) => (
              <Cell key={index} fill={barColor(entry.yield)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
