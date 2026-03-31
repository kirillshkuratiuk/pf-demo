"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  MOCK_TRADERS,
  CATEGORIES,
  CATEGORY_COLORS,
  formatPnl,
  formatVolume,
  type Trader,
  type Category,
} from "@/data/traders";

interface BubbleNode {
  trader: Trader;
  radius: number;
  category: Category;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const ISLAND_POSITIONS: Record<string, { fx: number; fy: number }> = {
  Crypto: { fx: 0.18, fy: 0.22 },
  Politics: { fx: 0.72, fy: 0.15 },
  Sports: { fx: 0.1, fy: 0.7 },
  Finance: { fx: 0.52, fy: 0.68 },
  "AI & Tech": { fx: 0.85, fy: 0.52 },
  Culture: { fx: 0.43, fy: 0.38 },
  Science: { fx: 0.62, fy: 0.35 },
  "World Events": { fx: 0.32, fy: 0.78 },
};

// Preload images and cache them
const imageCache = new Map<string, HTMLImageElement>();
function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = () => resolve(img); // fallback: broken image handled in draw
    img.src = src;
  });
}

export default function BubbleMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    trader: Trader; x: number; y: number;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const nodesRef = useRef<BubbleNode[]>([]);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const imagesLoadedRef = useRef(false);

  // Responsive sizing — mounted flag ensures we only read DOM on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    function measure() {
      const w = containerRef.current?.offsetWidth
        || containerRef.current?.getBoundingClientRect().width
        || document.body.clientWidth
        || window.innerWidth;
      const isMobile = w < 768;
      setDimensions({
        width: Math.round(w),
        height: Math.round(isMobile ? Math.max(480, w * 0.85) : Math.max(560, w * 0.48)),
      });
    }
    measure();
    // Re-measure aggressively to catch late CSS layouts
    const timers = [50, 150, 300, 600, 1000].map((ms) => setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      timers.forEach(clearTimeout);
    };
  }, [mounted]);

  // Find node under cursor
  const findNodeAt = useCallback((canvasX: number, canvasY: number): BubbleNode | null => {
    const t = transformRef.current;
    // Convert canvas coords to world coords
    const worldX = (canvasX - t.x) / t.k;
    const worldY = (canvasY - t.y) / t.k;

    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      if (dx * dx + dy * dy < node.radius * node.radius) return node;
    }
    return null;
  }, []);

  // Main effect: simulation + canvas rendering
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    // HiDPI canvas
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const pad = 80;
    const usedCategories = [...new Set(MOCK_TRADERS.map((t) => t.favoriteCategory))] as Category[];

    const clusters = usedCategories.map((cat) => {
      const pos = ISLAND_POSITIONS[cat] || { fx: 0.5, fy: 0.5 };
      return { category: cat, x: pad + pos.fx * (width - pad * 2), y: pad + pos.fy * (height - pad * 2) };
    });

    const maxPnl = Math.max(...MOCK_TRADERS.map((t) => Math.abs(t.pnl)));
    const radiusScale = d3.scaleSqrt().domain([0, maxPnl]).range([22, Math.min(width, height) * 0.09]);

    const nodes: BubbleNode[] = MOCK_TRADERS.map((trader) => {
      const cluster = clusters.find((c) => c.category === trader.favoriteCategory)!;
      return {
        trader, radius: radiusScale(Math.abs(trader.pnl)),
        category: trader.favoriteCategory as Category,
        x: cluster.x + (Math.random() - 0.5) * 30,
        y: cluster.y + (Math.random() - 0.5) * 30,
        vx: 0, vy: 0,
      };
    });
    nodesRef.current = nodes;

    // Preload all avatar images
    const avatarPromises = nodes
      .filter((n) => n.trader.avatar)
      .map((n) => loadImage(n.trader.avatar!));
    Promise.all(avatarPromises).then(() => {
      imagesLoadedRef.current = true;
      draw();
    });

    // --- Draw function ---
    let hoveredNode: BubbleNode | null = null;

    function draw() {
      const t = transformRef.current;

      // Reset transform and clear the FULL canvas buffer
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background — fill full buffer
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Now apply DPR scaling + zoom transform
      ctx.setTransform(dpr * t.k, 0, 0, dpr * t.k, dpr * t.x, dpr * t.y);

      // Draw island backgrounds
      for (const cluster of clusters) {
        const clusterNodes = nodes.filter((n) => n.category === cluster.category);
        const totalRadius = clusterNodes.reduce((s, n) => s + n.radius, 0) * 0.7 + 60;
        const color = CATEGORY_COLORS[cluster.category];

        // Radial gradient
        const grad = ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, totalRadius);
        grad.addColorStop(0, hexToRgba(color, 0.07));
        grad.addColorStop(1, hexToRgba(color, 0.015));
        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, totalRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Label
        ctx.fillStyle = "#999";
        ctx.font = "500 11px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(cluster.category, cluster.x, cluster.y - totalRadius + 14);
      }

      // Draw bubbles
      for (const node of nodes) {
        const isHovered = hoveredNode === node;

        ctx.save();
        ctx.translate(node.x, node.y);
        if (isHovered) ctx.scale(1.05, 1.05);

        // Shadow
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.shadowOffsetY = 2;

        // Circle clip for avatar
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);

        const color = CATEGORY_COLORS[node.category];
        if (node.trader.avatar && imageCache.has(node.trader.avatar)) {
          // Draw avatar image clipped to circle
          ctx.save();
          ctx.clip();
          const img = imageCache.get(node.trader.avatar)!;
          ctx.drawImage(img, -node.radius, -node.radius, node.radius * 2, node.radius * 2);
          ctx.restore();
        } else {
          // Fallback: colored circle with initial
          ctx.fillStyle = hexToRgba(color, 0.12);
          ctx.fill();
          ctx.fillStyle = color;
          ctx.font = `600 ${Math.max(18, node.radius * 0.5)}px -apple-system, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.trader.name.charAt(0).toUpperCase(), 0, 0);
        }

        // Ring
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(color, isHovered ? 0.85 : 0.4);
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Name label below
        ctx.fillStyle = "#0f151b";
        const fontSize = Math.max(11, Math.min(14, node.radius * 0.34));
        ctx.font = `500 ${fontSize}px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const name = node.trader.name.length > 12 ? node.trader.name.slice(0, 11) + "..." : node.trader.name;
        ctx.fillText(name, 0, node.radius + 6);

        // PnL label
        if (node.radius > 26) {
          ctx.fillStyle = node.trader.pnl >= 0 ? "#30A159" : "#ef4444";
          ctx.font = `400 ${Math.max(10, Math.min(12, node.radius * 0.28))}px -apple-system, system-ui, sans-serif`;
          ctx.fillText(formatPnl(node.trader.pnl), 0, node.radius + 6 + fontSize + 2);
        }

        ctx.restore();
      }
    }

    // --- D3 Force Simulation ---
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("x", d3.forceX<d3.SimulationNodeDatum>((d) => {
        const n = d as unknown as BubbleNode;
        return clusters.find((c) => c.category === n.category)!.x;
      }).strength(0.3))
      .force("y", d3.forceY<d3.SimulationNodeDatum>((d) => {
        const n = d as unknown as BubbleNode;
        return clusters.find((c) => c.category === n.category)!.y;
      }).strength(0.3))
      .force("collision", d3.forceCollide<d3.SimulationNodeDatum>()
        .radius((d) => (d as unknown as BubbleNode).radius + 6).strength(1))
      .force("charge", d3.forceManyBody().strength(-2))
      .on("tick", () => {
        for (const d of nodes) {
          d.x = Math.max(pad, Math.min(width - pad, d.x));
          d.y = Math.max(pad, Math.min(height - pad, d.y));
        }
        draw();
      });

    // --- Zoom + Pan (D3 on a fake SVG overlay for events, or directly on canvas) ---
    const canvasSelection = d3.select(canvas);
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 5])
      .filter((event) => {
        // Allow pinch (ctrlKey wheel), touch, mouse drag
        if (event.type === "wheel") return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey;
        return true;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        setTooltip(null);
        draw();
      });
    canvasSelection.call(zoom);

    // --- Mouse interaction ---
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const node = findNodeAt(cx, cy);

      if (node !== hoveredNode) {
        hoveredNode = node;
        canvas.style.cursor = node ? "pointer" : "grab";
        draw();
      }

      if (node) {
        const container = containerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          setTooltip({
            trader: node.trader,
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top,
          });
        }
      } else {
        setTooltip(null);
      }
    });

    canvas.addEventListener("mouseleave", () => {
      hoveredNode = null;
      setTooltip(null);
      draw();
    });

    // Touch tap for mobile tooltip
    canvas.addEventListener("touchend", (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const node = findNodeAt(touch.clientX - rect.left, touch.clientY - rect.top);
        if (node) {
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            setTooltip({
              trader: node.trader,
              x: touch.clientX - containerRect.left,
              y: touch.clientY - containerRect.top,
            });
          }
        } else {
          setTooltip(null);
        }
      }
    });

    return () => { simulation.stop(); };
  }, [dimensions, findNodeAt]);

  return (
    <div style={{ position: "relative" }}>
      {/* Filter bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 15px", flexWrap: "wrap", gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#0f151b", marginRight: "4px" }}>
            {MOCK_TRADERS.length} traders
          </span>
          {CATEGORIES.map((cat) => {
            const count = MOCK_TRADERS.filter((t) => t.favoriteCategory === cat).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "6px 12px", borderRadius: "9px", border: "none",
                  fontSize: "14px", fontWeight: 400, cursor: "pointer",
                  background: isActive ? "#0052ff" : "#f3f3f3",
                  color: isActive ? "#fff" : "#000",
                  transition: "all 0.15s",
                }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: CATEGORY_COLORS[cat], flexShrink: 0 }} />
                {cat}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: "12px", color: "#999" }}>
          Pinch to zoom · Drag to pan
        </span>
      </div>

      <div style={{ height: "1px", background: "#f2f2f2" }} />

      {/* Canvas — container has explicit height so ResizeObserver always reports width */}
      <div ref={containerRef} style={{
        position: "relative", overflow: "hidden",
        touchAction: "none",
        width: dimensions.width > 0 ? `${dimensions.width}px` : "100vw",
        height: dimensions.height > 0 ? `${dimensions.height}px` : "70vh",
      }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", cursor: "grab", border: "3px solid red", minHeight: "400px", width: "100%" }}
        />
        {/* Debug info */}
        <div style={{ position: "absolute", top: 4, left: 4, background: "red", color: "white", padding: "4px 8px", fontSize: "11px", borderRadius: "4px", zIndex: 99 }}>
          dim:{dimensions.width}x{dimensions.height} | mounted:{mounted?"Y":"N"} | ref:{containerRef.current?.offsetWidth ?? "null"}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute", zIndex: 50, pointerEvents: "none",
          left: Math.min(tooltip.x + 16, (dimensions.width || 300) - 280),
          top: tooltip.y - 10,
          width: "260px", borderRadius: "12px",
          background: "#fff", padding: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            {tooltip.trader.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tooltip.trader.avatar} alt={tooltip.trader.name}
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f3f3", fontSize: "16px", fontWeight: 600 }}>
                {tooltip.trader.name.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontSize: "16px", fontWeight: 500, color: "#0f151b" }}>{tooltip.trader.name}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>{tooltip.trader.address}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: "14px" }}>
            <div>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "2px" }}>PnL</div>
              <div style={{ fontWeight: 600, color: tooltip.trader.pnl >= 0 ? "#30A159" : "#ef4444" }}>
                {formatPnl(tooltip.trader.pnl)}
              </div>
            </div>
            <div>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "2px" }}>Volume</div>
              <div style={{ fontWeight: 600, color: "#0f151b" }}>{formatVolume(tooltip.trader.volume)}</div>
            </div>
            <div>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "2px" }}>Win Rate</div>
              <div style={{ fontWeight: 600, color: "#0f151b" }}>
                {((tooltip.trader.wins / (tooltip.trader.wins + tooltip.trader.losses)) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "2px" }}>Positions</div>
              <div style={{ fontWeight: 600, color: "#0f151b" }}>{tooltip.trader.positions.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: hex color to rgba string
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
