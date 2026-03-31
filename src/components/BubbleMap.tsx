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

// Responsive island grid — adapts to aspect ratio
function getIslandPositions(width: number, height: number, categories: Category[]) {
  const count = categories.length;
  const isPortrait = height > width * 0.8;

  if (isPortrait) {
    // Mobile: organic scatter positions
    const mobilePositions: Record<string, { fx: number; fy: number }> = {
      Crypto: { fx: 0.6, fy: 0.08 },
      Politics: { fx: 0.2, fy: 0.22 },
      Sports: { fx: 0.75, fy: 0.38 },
      Finance: { fx: 0.3, fy: 0.48 },
      "AI & Tech": { fx: 0.7, fy: 0.6 },
      Culture: { fx: 0.15, fy: 0.7 },
      Science: { fx: 0.55, fy: 0.78 },
      "World Events": { fx: 0.25, fy: 0.9 },
    };
    const pad = 60;
    return categories.map((cat) => {
      const pos = mobilePositions[cat] || { fx: 0.5, fy: 0.5 };
      return {
        category: cat,
        x: pad + pos.fx * (width - pad * 2),
        y: pad + pos.fy * (height - pad * 2),
      };
    });
  }

  // Desktop: organic scatter — pulled in from edges
  const positions: Record<string, { fx: number; fy: number }> = {
    Crypto: { fx: 0.15, fy: 0.25 },
    Politics: { fx: 0.48, fy: 0.18 },
    Sports: { fx: 0.78, fy: 0.25 },
    Finance: { fx: 0.15, fy: 0.72 },
    "AI & Tech": { fx: 0.48, fy: 0.72 },
    Culture: { fx: 0.78, fy: 0.72 },
    Science: { fx: 0.32, fy: 0.47 },
    "World Events": { fx: 0.63, fy: 0.47 },
  };

  const pad = 120;
  return categories.map((cat) => {
    const pos = positions[cat] || { fx: 0.5, fy: 0.5 };
    return {
      category: cat,
      x: pad + pos.fx * (width - pad * 2),
      y: pad + pos.fy * (height - pad * 2),
    };
  });
}

const DEFAULT_AVATAR = "/pf-assets/default-avatar.svg";

// Preload images
const imageCache = new Map<string, HTMLImageElement>();
function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    function measure() {
      const w = containerRef.current?.offsetWidth
        || document.body.clientWidth || window.innerWidth;
      const isMobile = w < 768;
      setDimensions({
        width: Math.round(w),
        height: Math.round(isMobile ? Math.max(600, w * 1.1) : Math.max(600, w * 0.52)),
      });
    }
    measure();
    const timers = [50, 150, 300, 600, 1000].map((ms) => setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); timers.forEach(clearTimeout); };
  }, [mounted]);

  const findNodeAt = useCallback((canvasX: number, canvasY: number): BubbleNode | null => {
    const t = transformRef.current;
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

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const filteredTraders = activeCategory
      ? MOCK_TRADERS.filter((t) => t.favoriteCategory === activeCategory)
      : MOCK_TRADERS;
    const usedCategories = [...new Set(filteredTraders.map((t) => t.favoriteCategory))] as Category[];
    const clusters = getIslandPositions(width, height, usedCategories);

    const maxPnl = Math.max(...MOCK_TRADERS.map((t) => Math.abs(t.pnl)));
    const isMobile = width < 768;
    // Linear scale on area (sqrt on radius) so visual area is proportional to PnL
    // Small minimum so low-PnL traders are visibly smaller
    const minR = isMobile ? 12 : 14;
    const maxR = Math.min(width, height) * (isMobile ? 0.1 : 0.12);
    const radiusScale = d3.scaleSqrt().domain([0, maxPnl]).range([minR, maxR]);

    const nodes: BubbleNode[] = filteredTraders.map((trader) => {
      const cluster = clusters.find((c) => c.category === trader.favoriteCategory)!;
      return {
        trader, radius: radiusScale(Math.abs(trader.pnl)),
        category: trader.favoriteCategory as Category,
        x: cluster.x + (Math.random() - 0.5) * 20,
        y: cluster.y + (Math.random() - 0.5) * 20,
        vx: 0, vy: 0,
      };
    });
    nodesRef.current = nodes;

    // Preload all avatars (use default for traders without one)
    const avatarPromises = nodes.map((n) => loadImage(n.trader.avatar || DEFAULT_AVATAR));
    Promise.all(avatarPromises).then(() => draw());

    let hoveredNode: BubbleNode | null = null;

    function draw() {
      const t = transformRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = "#fafbfc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply DPR + zoom
      ctx.setTransform(dpr * t.k, 0, 0, dpr * t.k, dpr * t.x, dpr * t.y);

      // --- Draw category labels above each cluster ---
      for (const cluster of clusters) {
        const clusterNodes = nodes.filter((n) => n.category === cluster.category);
        if (clusterNodes.length === 0) continue;

        // Find top of cluster
        let minY = Infinity;
        let avgX = 0;
        for (const n of clusterNodes) {
          if (n.y - n.radius < minY) minY = n.y - n.radius;
          avgX += n.x;
        }
        avgX /= clusterNodes.length;

        // Category label
        ctx.fillStyle = "#888";
        ctx.font = `500 12px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${cluster.category} · ${clusterNodes.length}`, avgX, minY - 10);
      }

      // --- Draw bubbles ---
      for (const node of nodes) {
        const isHovered = hoveredNode === node;

        ctx.save();
        ctx.translate(node.x, node.y);
        if (isHovered) ctx.scale(1.05, 1.05);

        // Shadow
        ctx.shadowColor = isHovered ? "rgba(0,0,0,0.14)" : "rgba(0,0,0,0.06)";
        ctx.shadowBlur = isHovered ? 14 : 6;
        ctx.shadowOffsetY = isHovered ? 3 : 1;

        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);

        const color = CATEGORY_COLORS[node.category];
        const r = node.radius;
        const avatarSrc = node.trader.avatar || DEFAULT_AVATAR;
        const hasRealAvatar = !!node.trader.avatar;
        const img = imageCache.get(avatarSrc);

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.clip();
          ctx.drawImage(img, -r, -r, r * 2, r * 2);
          // Dark overlay only on real avatars for text legibility
          if (hasRealAvatar) {
            const overlay = ctx.createLinearGradient(0, -r * 0.3, 0, r);
            overlay.addColorStop(0, "rgba(0,0,0,0)");
            overlay.addColorStop(0.6, "rgba(0,0,0,0.15)");
            overlay.addColorStop(1, "rgba(0,0,0,0.5)");
            ctx.fillStyle = overlay;
            ctx.fillRect(-r, -r, r * 2, r * 2);
          }
          ctx.restore();
        } else {
          ctx.fillStyle = hexToRgba(color, 0.1);
          ctx.fill();
        }

        // Ring
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(color, isHovered ? 0.8 : 0.35);
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Text inside bubble
        ctx.textAlign = "center";

        // Text inside bubble — always show name + PnL
        const textOnPhoto = hasRealAvatar;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        {
          // Always show name + PnL
          const nameSize = Math.max(7, Math.min(14, r * 0.28));
          const pnlSize = Math.max(6, Math.min(12, r * 0.24));
          const gap = nameSize * 0.15;

          const maxChars = Math.max(3, Math.floor(r * 0.14) + 3);
          const name = node.trader.name.length > maxChars
            ? node.trader.name.slice(0, maxChars - 1) + "…"
            : node.trader.name;

          ctx.fillStyle = textOnPhoto ? "#fff" : "#555";
          ctx.font = `600 ${nameSize}px -apple-system, system-ui, sans-serif`;
          ctx.fillText(name, 0, textOnPhoto ? r * 0.15 : -pnlSize * 0.5 - gap);

          ctx.fillStyle = textOnPhoto
            ? (node.trader.pnl >= 0 ? "#6ee7a0" : "#fca5a5")
            : (node.trader.pnl >= 0 ? "#30A159" : "#ef4444");
          ctx.font = `500 ${pnlSize}px -apple-system, system-ui, sans-serif`;
          ctx.fillText(formatPnl(node.trader.pnl), 0, textOnPhoto ? r * 0.15 + nameSize + gap : pnlSize * 0.5 + gap);
        }

        ctx.restore();
      }
    }

    // --- Simulation ---
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("x", d3.forceX<d3.SimulationNodeDatum>((d) => {
        const n = d as unknown as BubbleNode;
        return clusters.find((c) => c.category === n.category)!.x;
      }).strength(0.6))
      .force("y", d3.forceY<d3.SimulationNodeDatum>((d) => {
        const n = d as unknown as BubbleNode;
        return clusters.find((c) => c.category === n.category)!.y;
      }).strength(0.6))
      .force("collision", d3.forceCollide<d3.SimulationNodeDatum>()
        .radius((d) => (d as unknown as BubbleNode).radius + 3).strength(1))
      .force("charge", d3.forceManyBody().strength(-1))
      .on("tick", () => {
        draw();
      });

    // --- Zoom ---
    const canvasSelection = d3.select(canvas);
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 5])
      .filter((event) => {
        if (event.type === "wheel") return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey;
        return true;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        setTooltip(null);
        draw();
      });
    canvasSelection.call(zoom);

    // --- Mouse ---
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const node = findNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (node !== hoveredNode) {
        hoveredNode = node;
        canvas.style.cursor = node ? "pointer" : "grab";
        draw();
      }
      if (node) {
        const cr = containerRef.current?.getBoundingClientRect();
        if (cr) setTooltip({ trader: node.trader, x: e.clientX - cr.left, y: e.clientY - cr.top });
      } else { setTooltip(null); }
    });
    canvas.addEventListener("mouseleave", () => { hoveredNode = null; setTooltip(null); draw(); });

    // Touch tap
    canvas.addEventListener("touchend", (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const node = findNodeAt(touch.clientX - rect.left, touch.clientY - rect.top);
        if (node) {
          const cr = containerRef.current?.getBoundingClientRect();
          if (cr) setTooltip({ trader: node.trader, x: touch.clientX - cr.left, y: touch.clientY - cr.top });
        } else { setTooltip(null); }
      }
    });

    return () => { simulation.stop(); };
  }, [dimensions, findNodeAt, activeCategory]);

  return (
    <div style={{ position: "relative", padding: "0 20px 20px 20px" }}>
      {/* Filter bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 0", flexWrap: "wrap", gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#0f151b", marginRight: "4px" }}>
            {activeCategory
              ? `${MOCK_TRADERS.filter((t) => t.favoriteCategory === activeCategory).length} traders`
              : `${MOCK_TRADERS.length} traders`
            }
          </span>
          {CATEGORIES.map((cat) => {
            const count = MOCK_TRADERS.filter((t) => t.favoriteCategory === cat).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)}
                style={{
                  padding: "6px 12px", borderRadius: "9px", border: "none",
                  fontSize: "14px", fontWeight: 400, cursor: "pointer",
                  background: isActive ? "#0052ff" : "#f3f3f3",
                  color: isActive ? "#fff" : "#000",
                  transition: "all 0.15s",
                }}>
                {cat}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: "12px", color: "#999" }}>
          Pinch to zoom · Drag to pan
        </span>
      </div>


      {/* Canvas */}
      <div ref={containerRef} style={{
        position: "relative", overflow: "hidden",
        touchAction: "none",
        width: "100%",
        height: dimensions.height > 0 ? `${dimensions.height}px` : "70vh",
        borderRadius: "12px",
      }}>
        <canvas ref={canvasRef} style={{ display: "block", cursor: "grab" }} />
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
