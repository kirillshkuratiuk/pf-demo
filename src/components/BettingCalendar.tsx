"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
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

// Simulate daily stats from PnL + date seed
function getDayStats(date: string, pnl: number) {
  const seed = date.split("-").reduce((a, b) => a + parseInt(b), 0);
  const absPnl = Math.abs(pnl);
  return {
    trades: pnl === 0 ? 0 : Math.max(1, Math.round(3 + Math.sin(seed) * 8 + absPnl / 3000)),
    volume: pnl === 0 ? 0 : Math.round(absPnl * (2.5 + Math.sin(seed * 1.3) * 1.5)),
    bestMultiplier: pnl === 0 ? null : +(1 + Math.abs(Math.sin(seed * 0.7)) * 3.5).toFixed(2),
    worstMultiplier: pnl === 0 ? null : +(0.1 + Math.abs(Math.cos(seed * 0.9)) * 0.8).toFixed(2),
    marketsTraded: pnl === 0 ? 0 : Math.max(1, Math.round(2 + Math.sin(seed * 2.1) * 4)),
    winRate: pnl === 0 ? null : Math.round(40 + Math.sin(seed * 0.5) * 30 + (pnl > 0 ? 15 : -10)),
  };
}

// Simulate daily category breakdown
function getDailyCategories(
  date: string, dayPnl: number,
  overallCategories: { name: string; positions: number; pnl: number }[],
) {
  const seed = date.split("-").reduce((a, b) => a + parseInt(b), 0);
  const total = overallCategories.reduce((s, c) => s + c.positions, 0);
  return overallCategories.map((c, i) => {
    const baseWeight = c.positions / total;
    const variation = Math.sin(seed * (i + 1) * 0.7) * 0.4;
    const weight = Math.max(0.02, baseWeight + variation * baseWeight);
    const dailyPositions = Math.max(0, Math.round(weight * (8 + Math.abs(dayPnl) / 2000)));
    const dailyPnl = Math.round(dayPnl * weight * (1 + Math.sin(seed * (i + 2)) * 0.3));
    return { name: c.name, positions: dailyPositions, pnl: dailyPnl };
  });
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
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
      const seen = new Set<string>();

      while (cursor <= endDate) {
        const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        if (seen.has(dateStr)) { cursor.setDate(cursor.getDate() + 1); continue; }
        seen.add(dateStr);
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

  const labelWidth = 42;
  const headerHeight = 22;
  // Calculate cell size to fill available width
  const [containerWidth, setContainerWidth] = useState(0);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calRef.current) return;
    const measure = () => {
      const w = calRef.current?.clientWidth || 0;
      if (w > 0) setContainerWidth(w);
    };
    measure();
    const timers = [50, 200, 500].map(ms => setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); timers.forEach(clearTimeout); };
  }, []);

  const weekCount = weeks.length || 53;
  const availableWidth = (containerWidth || 1100) - labelWidth - 50; // 20px padding each side + buffer
  const cellPlusGap = availableWidth / weekCount;
  const cellGap = Math.max(2, Math.min(4, cellPlusGap * 0.15));
  // Min 14px so cells stay readable; if too small, container scrolls horizontally
  const cellSize = Math.max(14, cellPlusGap - cellGap);

  // Active radar + stats data
  const activeDay = hoveredDay && hoveredDay.pnl !== 0 ? hoveredDay : null;
  const dayStats = activeDay ? getDayStats(activeDay.date, activeDay.pnl) : null;

  const radarChartData = useMemo(() => {
    if (!categories) return null;
    const source = activeDay
      ? getDailyCategories(activeDay.date, activeDay.pnl, categories)
      : categories;
    return source.map((c) => ({ category: c.name, positions: c.positions, pnl: c.pnl }));
  }, [categories, activeDay]);

  const statsLabel = activeDay
    ? new Date(activeDay.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "All Time";

  const handleDayEnter = useCallback((e: React.MouseEvent<SVGRectElement>, day: { date: string; pnl: number }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest(".StatsUser-module__rxhoNG__StatsPerformanceWrapper")?.getBoundingClientRect();
    setHoveredDay({
      date: day.date, pnl: day.pnl,
      x: rect.left - (parent?.left || 0) + cellSize / 2,
      y: rect.top - (parent?.top || 0) - 8,
    });
  }, [cellSize]);

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
        <div className="betting-header-right" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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

      {/* Calendar — full width, scrollable on small screens */}
      <div ref={calRef} style={{ padding: "20px 20px 16px 20px", overflowX: "auto" }}>
        <svg
          width={Math.max(availableWidth, labelWidth + weekCount * (cellSize + cellGap))}
          height={headerHeight + 7 * (cellSize + cellGap)}
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
            week.map((day, dayIdx) => {
              const dayOfWeek = new Date(day.date).getDay();
              const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              return (
                <rect
                  key={`${weekIdx}-${dayIdx}`}
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

      <div className="divider__dashboard" />

      {/* Bottom section: Radar + Stats */}
      <div className="betting-bottom-section" style={{ display: "flex", gap: "40px", padding: "20px 20px 12px 20px", alignItems: "flex-start" }}>

        {/* Category Radar — larger */}
        {radarChartData && (
          <div className="betting-radar" style={{ flex: "0 0 360px" }}>
            <div style={{
              fontSize: "13px", fontWeight: 500, color: "var(--text-h1-primary, #0f151b)",
              marginBottom: "8px",
              transition: "all 0.15s",
            }}>
              Market Categories
              {activeDay && (
                <span style={{ color: "#999", fontWeight: 400, marginLeft: "6px" }}>
                  · {new Date(activeDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <div style={{ height: 280 }}>
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
                      borderRadius: "10px", fontSize: "13px", padding: "10px 14px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, _name: any, props: any) => {
                      const total = radarChartData?.reduce((s, c) => s + c.positions, 0) ?? 0;
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                      const pnl = props?.payload?.pnl ?? 0;
                      return [`${value} positions (${pct}%) · ${formatPnl(pnl)}`, props?.payload?.category];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="betting-stats-wrapper" style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 500, color: "var(--text-h1-primary, #0f151b)",
            marginBottom: "8px",
            transition: "all 0.15s",
          }}>
            {statsLabel}
            {activeDay && (
              <span style={{
                marginLeft: "8px", fontWeight: 600,
                color: activeDay.pnl >= 0 ? "#30A159" : "#ef4444",
              }}>
                {formatPnl(activeDay.pnl)}
              </span>
            )}
          </div>

          <div className="StatsUser-module__rxhoNG__performanceGrid betting-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">PnL</div>
              <div className={`StatsUser-module__rxhoNG__statValue ${(activeDay ? activeDay.pnl : totalPnl) >= 0 ? "StatsUser-module__rxhoNG__positive" : "StatsUser-module__rxhoNG__negative"}`}>
                {formatPnl(activeDay ? activeDay.pnl : totalPnl)}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Volume</div>
              <div className="StatsUser-module__rxhoNG__statValue" style={{ color: "var(--text-h1-primary)" }}>
                {dayStats ? formatVolume(dayStats.volume) : formatVolume(dailyPnl.reduce((s, d) => s + Math.abs(d.pnl) * 3, 0))}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Trades</div>
              <div className="StatsUser-module__rxhoNG__statValue" style={{ color: "var(--text-h1-primary)" }}>
                {dayStats ? dayStats.trades : dailyPnl.filter(d => d.pnl !== 0).length}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Markets</div>
              <div className="StatsUser-module__rxhoNG__statValue" style={{ color: "var(--text-h1-primary)" }}>
                {dayStats ? dayStats.marketsTraded : categories?.reduce((s, c) => s + c.positions, 0)?.toLocaleString() || "—"}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Win Rate</div>
              <div className={`StatsUser-module__rxhoNG__statValue ${(dayStats?.winRate ?? Math.round(winDays / (winDays + lossDays) * 100)) >= 50 ? "StatsUser-module__rxhoNG__positive" : "StatsUser-module__rxhoNG__negative"}`}>
                {dayStats?.winRate != null ? `${dayStats.winRate}%` : `${Math.round(winDays / (winDays + lossDays) * 100)}%`}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Avg Trade Size</div>
              <div className="StatsUser-module__rxhoNG__statValue" style={{ color: "var(--text-h1-primary)" }}>
                {dayStats ? formatVolume(dayStats.trades > 0 ? Math.round(dayStats.volume / dayStats.trades) : 0) : formatVolume(Math.round(dailyPnl.reduce((s, d) => s + Math.abs(d.pnl) * 3, 0) / dailyPnl.filter(d => d.pnl !== 0).length))}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Best Multiplier</div>
              <div className="StatsUser-module__rxhoNG__statValue StatsUser-module__rxhoNG__positive">
                {dayStats?.bestMultiplier ? `${dayStats.bestMultiplier}x` : "4.2x"}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Worst Multiplier</div>
              <div className="StatsUser-module__rxhoNG__statValue StatsUser-module__rxhoNG__negative">
                {dayStats?.worstMultiplier ? `${dayStats.worstMultiplier}x` : "0.3x"}
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__statCard">
              <div className="StatsUser-module__rxhoNG__statLabel">Portfolio Value</div>
              <div className="StatsUser-module__rxhoNG__statValue" style={{ color: "var(--text-h1-primary)" }}>
                {dayStats ? formatVolume(Math.round(234647 + (activeDay?.pnl || 0) * 0.3)) : "$234.6K"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day tooltip on calendar */}
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
