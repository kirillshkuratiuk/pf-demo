"use client";

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { CATEGORY_COLORS, type Category } from "@/data/traders";

interface Props {
  // Category name → number of positions
  categories: { name: string; positions: number; pnl: number }[];
  traderName: string;
}

export default function CategoryRadar({ categories, traderName }: Props) {
  const maxPositions = Math.max(...categories.map((c) => c.positions));

  const chartData = categories.map((c) => ({
    category: c.name,
    positions: c.positions,
    pnl: c.pnl,
    fullMark: maxPositions,
  }));

  return (
    <div className="pf-feature-card" style={{ height: "100%" }}>
      <h3>Market Categories</h3>
      <p className="subtitle">Distribution of positions across categories</p>

      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis
              dataKey="category"
              tick={({ x, y, payload }) => {
                const color = CATEGORY_COLORS[payload.value as Category] || "#4b5563";
                return (
                  <text
                    x={x} y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={color}
                    fontSize={11}
                    fontWeight={600}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <Radar
              name="Positions"
              dataKey="positions"
              stroke="var(--accent-color, #284b63)"
              fill="var(--accent-color, #284b63)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid var(--border-color, #e0e0e0)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => {
                const pnl = props?.payload?.pnl ?? 0;
                return [
                  `${value} positions (${pnl >= 0 ? "+" : ""}$${Math.abs(pnl) >= 1000 ? (pnl / 1000).toFixed(1) + "K" : pnl.toFixed(0)})`,
                  props?.payload?.category ?? "",
                ];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
        {categories
          .sort((a, b) => b.positions - a.positions)
          .map((c) => {
            const pct = Math.round((c.positions / categories.reduce((s, x) => s + x.positions, 0)) * 100);
            const color = CATEGORY_COLORS[c.name as Category] || "#9ca3af";
            return (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "var(--text-p-primary)", flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-h1-primary)", minWidth: "32px", textAlign: "right" }}>{pct}%</span>
                <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "var(--white-secondary, #f4f5f6)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "2px" }} />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
