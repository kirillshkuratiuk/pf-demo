"use client";

import { useState, useEffect } from "react";

export default function DebugPage() {
  const [info, setInfo] = useState("waiting...");

  useEffect(() => {
    setInfo(
      `JS works! window: ${window.innerWidth}x${window.innerHeight}, dpr: ${window.devicePixelRatio}, ua: ${navigator.userAgent.slice(0, 80)}`
    );
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24 }}>Debug Page</h1>
      <p style={{ fontSize: 16, background: "#eee", padding: 12, borderRadius: 8, wordBreak: "break-all" }}>
        {info}
      </p>
      <div
        style={{ width: 200, height: 200, background: "red", marginTop: 20 }}
      >
        <canvas
          width={200}
          height={200}
          ref={(canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = "white";
            ctx.font = "20px system-ui";
            ctx.fillText("Canvas works!", 20, 110);
          }}
        />
      </div>
    </div>
  );
}
