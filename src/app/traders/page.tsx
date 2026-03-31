"use client";

import { MOCK_TRADERS } from "@/data/traders";
import BettingCalendar from "@/components/BettingCalendar";

const trader = MOCK_TRADERS.find((t) => t.name === "Car")!;

export default function TradersPage() {
  return (
    <>
    <div className="pnl-stats-wrapper" style={{ display: "flex", width: "100%", overflow: "hidden", flexDirection: "row" }}>

      {/* ===== LEFT COLUMN (70%) ===== */}
      <div style={{ flex: "0 0 70%", minWidth: 0, overflow: "hidden" }}>
        <div className="outer_chart" style={{ width: "100%" }}>
          <div className="outer_border">

            {/* --- Trader Header --- */}
            <div className="user_stat_pnl_chart">
              <div className="user_stat_pnl_chart_left_div">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="user_stat_pnl_chart_left_img" src="/avatars/Car.png" alt="Car" />
                </div>
                <div className="user_stat_pnl_chart_left_name_div">
                  <div className="user_stat_pnl_chart_top_div">
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
                      <h2>Car</h2>
                    </div>
                    <button type="button" className="address-span-with-tooltip" style={{ cursor: "pointer", position: "relative" }}>
                      0x7c...5c6b
                    </button>
                  </div>
                  <div className="user_stat_pnl_chart_left_poly_button" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap", minWidth: 0 }}>
                    <a href="https://polymarket.com/profile/0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", padding: "0 13px", height: "35px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", borderRadius: "6px", background: "#1652F0", fontSize: "14px", fontWeight: 400, gap: "6px", whiteSpace: "nowrap" }}>
                      View Profile
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/pf-assets/New_Window.svg" alt="" style={{ width: "13px", filter: "brightness(10)" }} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="user_stat_pnl_chart_right_div">
                <div className="user_stat_pnl_chart_right_div_stats_outer">
                  <div className="user_stat_pnl_chart_right_div_stats">
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img style={{ width: "17px" }} src="/pf-assets/equalizer.svg" alt="" />
                      <span className="stat-label-full pnl-stat-card-label">Trading Volume</span>
                      <span className="stat-label-short pnl-stat-card-label">Volume</span>
                    </div>
                    <h2>$144,203,714</h2>
                  </div>
                </div>
                <div className="user_stat_pnl_chart_right_div_stats_outer">
                  <div className="user_stat_pnl_chart_right_div_stats">
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img style={{ width: "17px" }} src="/pf-assets/money_bag_darkmode.svg" alt="" />
                      <span className="stat-label-full pnl-stat-card-label">Portfolio Size</span>
                      <span className="stat-label-short pnl-stat-card-label">Portfolio</span>
                    </div>
                    <h2>$234,647</h2>
                  </div>
                </div>
                <div className="user_stat_pnl_chart_right_div_stats_outer">
                  <div className="user_stat_pnl_chart_right_div_stats">
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img style={{ width: "17px" }} src="/pf-assets/equalizer.svg" alt="" />
                      <span className="stat-label-full pnl-stat-card-label">Markets Traded</span>
                      <span className="stat-label-short pnl-stat-card-label">Markets</span>
                    </div>
                    <h2>6,452</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* --- PnL Header + Chart Placeholder --- */}
            <div className="chart_top_div_outer">
              <div className="chart_lower_div">
                <div className="chart_pnl">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img style={{ width: "23px" }} src="/pf-assets/trend-up-green.svg" alt="PnL Trend" />
                    <h2 style={{ color: "#30A159" }}>$1,096,543</h2>
                  </div>
                </div>
                <div className="selector_wrapper" style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="selector_Compare_button" style={{ cursor: "pointer", marginTop: "-2px" }}>
                      <span className="add-account-full">ADD ACCOUNT</span>
                      <span className="add-account-short">ADD</span>
                    </div>
                    <div style={{ borderLeft: "1px solid var(--border-color)", height: "25px", paddingLeft: "20px" }}>
                      <div className="selector_Compare_button" style={{ cursor: "pointer" }}>
                        <span>COMPARE</span>
                      </div>
                    </div>
                  </div>
                  <div className="leaderboard__main_selectors pnl-range-selectors">
                    <button className="leaderboard__main_selector_btn pnl-range-selector-btn">1M</button>
                    <button className="leaderboard__main_selector_btn pnl-range-selector-btn active">1Y</button>
                    <button className="leaderboard__main_selector_btn pnl-range-selector-btn">YTD</button>
                    <button className="leaderboard__main_selector_btn pnl-range-selector-btn">Max</button>
                  </div>
                </div>
              </div>

              {/* Chart placeholder */}
              <div style={{ width: "100%", height: "clamp(280px, 60vh, 550px)", minHeight: "280px", position: "relative", background: "var(--white-secondary, #f4f5f6)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/pf-assets/predictfolio_watermark_whitemode.svg" alt="PredictFolio watermark" style={{ position: "absolute", bottom: "20px", right: "20px", opacity: 0.1, pointerEvents: "none", userSelect: "none", zIndex: 0, width: "330px" }} />
                <span style={{ color: "var(--text-p-primary, #9ca3af)", fontSize: "14px" }}>Chart placeholder — PnL data visualization</span>
              </div>
            </div>

            {/* --- Chart Controls --- */}
            <div className="chart-controls-wrapper" style={{ marginTop: "16px", position: "relative", display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
              <div className="chart-controls-group chart-controls-group-left" style={{ display: "flex", gap: "12px" }}>
                <div className="settings-button-wrapper">
                  <button className="chart-settings-button" type="button" style={{ padding: "4px 8px 4px 6px", borderRadius: "55px", border: "none", backgroundColor: "var(--card-bg)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/pf-assets/settings_button.svg" alt="settings" width="22" height="22" />
                    <span style={{ fontSize: "14px", fontWeight: 400 }}>Settings</span>
                  </button>
                </div>
              </div>
              <div className="chart-controls-group chart-controls-group-right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button type="button" style={{ padding: "6px 9px 7px 9px", borderRadius: "55px", border: "none", backgroundColor: "var(--card-bg)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pf-assets/projection.svg" alt="" width="11" height="11" />
                  <span style={{ fontSize: "14px", fontWeight: 400 }}>Projection</span>
                </button>
                <button type="button" style={{ padding: "6px 9px 7px 9px", borderRadius: "55px", border: "none", backgroundColor: "var(--card-bg)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pf-assets/share.svg" alt="share" width="16" height="16" />
                  <span style={{ fontSize: "14px", fontWeight: 400 }}>Share</span>
                </button>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* ===== RIGHT COLUMN (30%) ===== */}
      <div style={{ flex: "0 0 30%", minWidth: 0, overflow: "visible" }}>

        {/* --- Performance Stats --- */}
        <div className="StatsUser-module__rxhoNG__StatsPerformanceWrapper">
          <div className="StatsUser-module__rxhoNG__PerformanceWrapper">
            <div className="StatsUser-module__rxhoNG__performanceHeader">
              <span className="StatsUser-module__rxhoNG__calendarTitle">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Performance
              </span>
              <div className="StatsUser-module__rxhoNG__viewToggle" data-active="1">
                <button className="StatsUser-module__rxhoNG__viewToggleBtn StatsUser-module__rxhoNG__active">
                  <span className="StatsUser-module__rxhoNG__buttonLabel">Current<span className="StatsUser-module__rxhoNG__labelSuffix"> Performance</span></span>
                </button>
                <button className="StatsUser-module__rxhoNG__viewToggleBtn">
                  <span className="StatsUser-module__rxhoNG__buttonLabel">Average<span className="StatsUser-module__rxhoNG__labelSuffix"> Performance</span></span>
                </button>
              </div>
            </div>
            <div className="StatsUser-module__rxhoNG__performanceGrid">
              {[
                { label: "1D", value: "-$518.45", cls: "negative" },
                { label: "1W", value: "+$20.29K", cls: "positive" },
                { label: "1M", value: "+$165.12K", cls: "positive" },
                { label: "YTD", value: "+$328.80K", cls: "positive" },
                { label: "1Y", value: "+$728.70K", cls: "positive" },
                { label: "MAX", value: "+$1.10M", cls: "positive" },
              ].map((s) => (
                <div key={s.label} className="StatsUser-module__rxhoNG__statCard">
                  <div className="StatsUser-module__rxhoNG__statLabel">{s.label}</div>
                  <div className={`StatsUser-module__rxhoNG__statValue StatsUser-module__rxhoNG__${s.cls}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- UserInfo --- */}
        <div className="UserInfo-module__NJrgJG__wrapper">
          <div className="UserInfo-module__NJrgJG__profileHeader">
            <div className="UserInfo-module__NJrgJG__profileLeft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="UserInfo-module__NJrgJG__avatar" src="/avatars/Car.png" alt="Car" />
              <span className="UserInfo-module__NJrgJG__username">Car</span>
            </div>
            <div className="UserInfo-module__NJrgJG__profileActions">
              <button className="UserInfo-module__NJrgJG__likeBtn" aria-label="Like">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="UserInfo-module__NJrgJG__likeIcon" src="/pf-assets/thumbs-up-black.svg" alt="like" width="16" height="16" />
                <span className="UserInfo-module__NJrgJG__likeCount">59</span>
              </button>
              <button className="UserInfo-module__NJrgJG__likeBtn" aria-label="Dislike">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="UserInfo-module__NJrgJG__likeIcon" src="/pf-assets/dislike.svg" alt="dislike" width="16" height="16" />
                <span className="UserInfo-module__NJrgJG__likeCount">108</span>
              </button>
            </div>
          </div>

          <div className="UserInfo-module__NJrgJG__scoreBar">
            <div className="UserInfo-module__NJrgJG__scoreLeft">
              <span className="UserInfo-module__NJrgJG__scoreLabel">Profile score</span>
              <span className="UserInfo-module__NJrgJG__scoreInfoWrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="UserInfo-module__NJrgJG__scoreInfoIcon" src="/pf-assets/question.svg" alt="info" width="14" height="14" />
              </span>
            </div>
            <div className="UserInfo-module__NJrgJG__scoreTrack">
              <div className="UserInfo-module__NJrgJG__scoreFill UserInfo-module__NJrgJG__scoreFillWarn" style={{ width: "35%" }} />
            </div>
            <span className="UserInfo-module__NJrgJG__scoreValue UserInfo-module__NJrgJG__scoreValueWarn">35%</span>
          </div>

          <div className="UserInfo-module__NJrgJG__fundsRow">
            <div className="UserInfo-module__NJrgJG__fundCard">
              <span className="UserInfo-module__NJrgJG__fundLabel">Wins</span>
              <span className="UserInfo-module__NJrgJG__fundValue UserInfo-module__NJrgJG__positive">4,257</span>
            </div>
            <div className="UserInfo-module__NJrgJG__fundCard">
              <span className="UserInfo-module__NJrgJG__fundLabel">Losses</span>
              <span className="UserInfo-module__NJrgJG__fundValue UserInfo-module__NJrgJG__negative">2,252</span>
            </div>
          </div>

          <ul className="UserInfo-module__NJrgJG__statsList">
            <li className="UserInfo-module__NJrgJG__statItem">
              <span className="UserInfo-module__NJrgJG__statLabel">Address</span>
              <span className="UserInfo-module__NJrgJG__statValue">0x7c3d...5c6b</span>
            </li>
            <li className="UserInfo-module__NJrgJG__statItem">
              <span className="UserInfo-module__NJrgJG__statLabel">Favorite Category</span>
              <span className="UserInfo-module__NJrgJG__statValue">Crypto</span>
            </li>
            <li className="UserInfo-module__NJrgJG__statItem">
              <span className="UserInfo-module__NJrgJG__statLabel">Socials</span>
              <span className="UserInfo-module__NJrgJG__statValue">
                <a href="https://x.com/CarOnPolymarket" target="_blank" rel="noopener noreferrer" className="UserInfo-module__NJrgJG__socialIconWrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="UserInfo-module__NJrgJG__socialIcon" alt="X" src="/pf-assets/X_logo.svg" />
                </a>
              </span>
            </li>
            <li className="UserInfo-module__NJrgJG__statItem">
              <span className="UserInfo-module__NJrgJG__statLabel">Sign Up Date</span>
              <span className="UserInfo-module__NJrgJG__statValue">Feb 9, 2024</span>
            </li>
          </ul>
        </div>

      </div>
    </div>

    {/* ===== FULL WIDTH: Betting Activity ===== */}
    <div style={{ marginTop: "20px" }}>
      <BettingCalendar dailyPnl={trader.dailyPnl} categories={trader.categoryBreakdown} />
    </div>
    </>
  );
}
