"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { formatPnl } from "@/data/traders";

interface Props {
  dailyPnl: { date: string; pnl: number }[];
  categories?: { name: string; positions: number; pnl: number }[];
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

function getColor(pnl: number, maxAbsPnl: number): string {
  if (pnl === 0) return "var(--white-secondary, #ebeef1)";
  const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
  if (pnl > 0) {
    return `rgb(${Math.round(220 - 198 * intensity)}, ${Math.round(240 - 77 * intensity)}, ${Math.round(220 - 146 * intensity)})`;
  } else {
    return `rgb(${Math.round(252 - 32 * intensity)}, ${Math.round(220 - 182 * intensity)}, ${Math.round(220 - 182 * intensity)})`;
  }
}

// Simulate a daily category breakdown based on the day's PnL and overall distribution
function getDailyCategories(
  date: string,
  dayPnl: number,
  overallCategories: { name: string; positions: number; pnl: number }[],
) {
  // Use date as seed for deterministic "randomness"
  const seed = date.split("-").reduce((a, b) => a + parseInt(b), 0);
  const total = overallCategories.reduce((s, c) => s + c.positions, 0);

  return overallCategories.map((c, i) => {
    // Base weight from overall distribution
    const baseWeight = c.positions / total;
    // Add date-seeded variation (±40%)
    const variation = Math.sin(seed * (i + 1) * 0.7) * 0.4;
    const weight = Math.max(0.02, baseWeight + variation * baseWeight);
    // Scale to daily positions (roughly 5-30 trades per day)
    const dailyPositions = Math.max(0, Math.round(weight * (8 + Math.abs(dayPnl) / 2000)));
    const dailyPnl = Math.round(dayPnl * weight * (1 + Math.sin(seed * (i + 2)) * 0.3));

    return { name: c.name, positions: dailyPositions, pnl: dailyPnl };
  });
}

export default function BettingCalendar({ dailyPnl, categories }: Props) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string; pnl: number; x: number; y: number;
  } | null>(null);

  const { weeks, monthLabels, maxAbsPnl, totalPnl, winDays, lossDays } =
    useMemo(() => {
      const pnlMap = new Map(dailyPnl.map((d) => [d.date, d.pnl]));
      const maxAbs = Math.max(...dailyPnl.map((d) => Math.abs(d.pnl)), 1);
      const endDate = new Date(dailyPnl[dailyPnl.length - 1]?.date || "2026-03-30");
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 364);
      while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() - 1);

      const weeksArr: { date: string; pnl: number }[][] = [];
      let currentWeek: { date: string; pnl: number }[] = [];
      const labels: { month: string; weekIndex: number }[] = [];
      let lastMonth = -1;
      const cursor = new Date(startDate);
      let weekIndex = 0;

      while (cursor <= endDate) {
        const dateStr = cursor.toISOString().split("T")[0];
        const month = cursor.getMonth();
        if (month !== lastMonth && cursor.getDay() === 1) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
        currentWeek.push({ date: dateStr, pnl: pnlMap.get(dateStr) || 0 });
        if (cursor.getDay() === 0) {
          weeksArr.push(currentWeek);
          currentWeek = [];
          weekIndex++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      if (currentWeek.length > 0) weeksArr.push(currentWeek);

      return {
        weeks: weeksArr, monthLabels: labels, maxAbsPnl: maxAbs,
        totalPnl: dailyPnl.reduce((s, d) => s + d.pnl, 0),
        winDays: dailyPnl.filter((d) => d.pnl > 0).length,
        lossDays: dailyPnl.filter((d) => d.pnl < 0).length,
      };
    }, [dailyPnl]);

  const cellSize = 22;
  const cellGap = 4;
  const labelWidth = 36;
  const headerHeight = 22;

  // Radar data: use daily breakdown when hovering, otherwise overall
  const activeRadarData = useMemo(() => {
    if (!categories) return null;
    if (hoveredDay && hoveredDay.pnl !== 0) {
      return getDailyCategories(hoveredDay.date, hoveredDay.pnl, categories);
    }
    return categories.map((c) => ({
      name: c.name,
      positions: c.positions,
      pnl: c.pnl,
    }));
  }, [categories, hoveredDay]);

  const radarChartData = activeRadarData?.map((c) => ({
    category: c.name,
    positions: c.positions,
    pnl: c.pnl,
  }));

  const svgWidth = labelWidth + weeks.length * (cellSize + cellGap);
  const svgHeight = headerHeight + 7 * (cellSize + cellGap);

  const handleDayEnter = useCallback((e: React.MouseEvent<SVGRectElement>, day: { date: string; pnl: number }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest(".StatsUser-module__rxhoNG__StatsPerformanceWrapper")?.getBoundingClientRect();
    setHoveredDay({
      date: day.date, pnl: day.pnl,
      x: rect.left - (parent?.left || 0) + cellSize / 2,
      y: rect.top - (parent?.top || 0) - 8,
    });
  }, [cellSize]);

  const radarLabel = hoveredDay && hoveredDay.pnl !== 0
    ? new Date(hoveredDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "All Time";

  return (
    <div className="StatsUser-module__rxhoNG__StatsPerformanceWrapper" style={{ position: "relative" }}>
      {/* Header */}
      <div className="StatsUser-module__rxhoNG__calendarHeader">
        <div className="StatsUser-module__rxhoNG__calendarDateSection">
          <span className="StatsUser-module__rxhoNG__calendarDateTitle">
            Betting Activity
          </span>
          <span className={`StatsUser-module__rxhoNG__monthTotalPnL StatsUser-module__rxhoNG__${totalPnl >= 0 ? "positive" : "negative"}`}>
            {formatPnl(totalPnl)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--text-p-primary, #4b5563)" }}>
            <span>Loss</span>
            <div style={{ display: "flex", gap: "2px" }}>
              {[-1, -0.6, -0.3, 0, 0.3, 0.6, 1].map((val) => (
                <div key={val} style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: getColor(val * maxAbsPnl, maxAbsPnl) }} />
              ))}
            </div>
            <span>Profit</span>
          </div>
          <span style={{ fontSize: "14px", color: "var(--text-p-primary)" }}>
            {winDays} winning, {lossDays} losing days
          </span>
        </div>
      </div>

      <div className="divider__dashboard" />

      {/* Content row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0px", padding: "20px 0 8px" }}>
        {/* Calendar grid */}
        <div style={{ flex: "1 1 auto", minWidth: 0, overflowX: "auto" }}>
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{ display: "block" }}
          >
            {monthLabels.map((label, i) => (
              <text key={i} x={labelWidth + label.weekIndex * (cellSize + cellGap)} y={12}
                fill="var(--text-p-primary, #4b5563)" fontSize="13" fontWeight="500">
                {label.month}
              </text>
            ))}
            {DAYS.map((day, i) => (
              <text key={i} x={0}
                y={headerHeight + i * (cellSize + cellGap) + cellSize * 0.7}
                fill="var(--text-p-primary, #4b5563)" fontSize="13">
                {day}
              </text>
            ))}
            {weeks.map((week, weekIdx) =>
              week.map((day) => {
                const dayOfWeek = new Date(day.date).getDay();
                const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                return (
                  <rect
                    key={day.date}
                    x={labelWidth + weekIdx * (cellSize + cellGap)}
                    y={headerHeight + row * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={3}
                    fill={getColor(day.pnl, maxAbsPnl)}
                    stroke={hoveredDay?.date === day.date ? "var(--text-h1-primary, #0f151b)" : "transparent"}
                    strokeWidth={1.5}
                    style={{ cursor: "pointer", transition: "all 0.1s" }}
                    onMouseEnter={(e) => handleDayEnter(e, day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                );
              })
            )}
          </svg>
        </div>

        {/* Category Radar */}
        {radarChartData && (
          <div style={{ flex: "0 0 340px", position: "relative" }}>
            {/* Label showing what the radar currently reflects */}
            <div style={{
              textAlign: "center", fontSize: "12px", fontWeight: 500,
              color: "var(--text-p-primary, #4b5563)",
              marginBottom: "-4px",
              transition: "all 0.15s",
              opacity: hoveredDay && hoveredDay.pnl !== 0 ? 1 : 0.5,
            }}>
              {radarLabel}
            </div>
            <div style={{ height: svgHeight - 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="var(--border-color, #e0e0e0)" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "var(--text-p-primary, #4b5563)", fontSize: 13 }}
                  />
                  <Radar
                    name="Positions"
                    dataKey="positions"
                    stroke="var(--accent-color, #284b63)"
                    fill="var(--accent-color, #284b63)"
                    fillOpacity={0.12}
                    strokeWidth={1.5}
                    isAnimationActive={true}
                    animationDuration={200}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid var(--border-color, #e0e0e0)",
                      borderRadius: "10px",
                      fontSize: "13px",
                      padding: "10px 14px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, _name: any, props: any) => {
                      const total = radarChartData.reduce((s, c) => s + c.positions, 0);
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                      const pnl = props?.payload?.pnl ?? 0;
                      const pnlStr = formatPnl(pnl);
                      return [`${value} positions (${pct}%) · ${pnlStr}`, props?.payload?.category];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Day tooltip */}
      {hoveredDay && (
        <div style={{
          position: "absolute", zIndex: 50, left: hoveredDay.x, top: hoveredDay.y,
          transform: "translate(-50%, -100%)",
          borderRadius: "10px", border: "1px solid var(--border-color)",
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)",
          padding: "10px 14px", fontSize: "13px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          <div style={{ color: "var(--text-p-primary)", marginBottom: "2px" }}>
            {new Date(hoveredDay.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: hoveredDay.pnl > 0 ? "#16a34a" : hoveredDay.pnl < 0 ? "#dc2626" : "var(--text-p-primary)" }}>
            {hoveredDay.pnl === 0 ? "No activity" : formatPnl(hoveredDay.pnl)}
          </div>
        </div>
      )}
    </div>
  );
}
