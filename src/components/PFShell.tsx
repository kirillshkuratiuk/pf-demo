"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PFShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {/* Header — matches PredictFolio's exact structure */}
      <header className="header_pf">
        <div className="container">
          <div className="outer__header">
            {/* Left: Logo + Nav */}
            <div className="left-side-header">
              <div className="logo">
                <Link href="/">
                  <span className="logo-theme-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="logo-theme-img logo-theme-img-light"
                      src="/pf-assets/Blue Logo Mark.svg"
                      alt="PredictFolio Logo"
                    />
                  </span>
                </Link>
              </div>
            </div>

            {/* Center: Search */}
            <div className="center-header">
              <div className="search-header">
                <div className="HeaderSearch-module__DRorZW__container">
                  <form
                    className="HeaderSearch-module__DRorZW__form"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="HeaderSearch-module__DRorZW__inputWrapper">
                      <input
                        className="HeaderSearch-module__DRorZW__input"
                        placeholder="Search user or market"
                        type="text"
                      />
                      <span className="HeaderSearch-module__DRorZW__searchIcon">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/pf-assets/search_icon_header.svg"
                          alt="Search"
                        />
                      </span>
                      <span className="HeaderSearch-module__DRorZW__shortcutBadge">
                        Shift Q
                      </span>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right: minimal — just a badge */}
            <div className="right-side-header">
              <div className="button-right-header">
                <span
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                  }}
                >
                  Feature Demo by Kirill
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="dashboard__wrapper">
        <div className="container">
          {/* Tab navigation */}
          <div className="dashboard__navigation">
            <Link href="/">
              <button
                className={
                  pathname === "/" ? "nav-btn_active" : "nav-btn"
                }
              >
                Bubble Map
              </button>
            </Link>
            <Link href="/traders">
              <button
                className={
                  pathname === "/traders" ? "nav-btn_active" : "nav-btn"
                }
              >
                Traders
              </button>
            </Link>
          </div>

          <div className="divider__dashboard divider__dashboard--top" />

          {/* Tab content */}
          <div className="tab-panels">
            <div className="tab-panel active">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
