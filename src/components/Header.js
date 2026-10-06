'use client';

import { useState, useRef, useEffect } from 'react';

export default function Header({
  onToggleSidebar,
  isSidebarOpen = true,
  activeModel = 'mabix-1.0',
  onSelectModel,
  onOpenImagine,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isApex = activeModel === 'mabix-3.0-apex';
  const isUltra = activeModel === 'mabix-2.0-ultra';

  return (
    <header className="chat-header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? '◫' : '☰'}
        </button>
        <div className="header-brand">
          <img src="/logo.png" alt="MABIX Logo" className="header-logo-img" />
          <h1 className="header-title">MABIX</h1>
          {isApex ? (
            <span className="header-apex-pill">3.0 APEX</span>
          ) : isUltra ? (
            <span className="header-ultra-pill">2.0 ULTRA</span>
          ) : null}
        </div>
      </div>

      <div className="header-right">
        {/* Quick Imagine Photo Studio Shortcut - In MABIX 2.0 Core Ultra */}
        {isUltra && (
          <button
            type="button"
            className="header-imagine-btn"
            onClick={onOpenImagine}
            title="Open Imagine Photo Studio (Background Removal & Scene Swap)"
          >
            <span className="btn-icon">🎞️</span>
            <span className="btn-text">Imagine Studio</span>
          </button>
        )}

        {/* Model Selector Dropdown */}
        <div className="model-selector-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className={`model-selector ${isApex ? 'apex-active' : isUltra ? 'ultra-active' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Select AI Engine"
          >
            <span className={`model-status-dot ${isApex ? 'cyan' : isUltra ? 'gold' : 'purple'}`}></span>
            <span className="model-name">
              {isApex
                ? 'MABIX 3.0 CORE (APEX)'
                : isUltra
                ? 'MABIX 2.0 (core ultra)'
                : 'MABIX 1.0 (core)'}
            </span>
            <span className="dropdown-arrow">{dropdownOpen ? '▴' : '▾'}</span>
          </button>

          {dropdownOpen && (
            <div className="model-dropdown-menu">
              <div className="dropdown-header">Select MABIX Engine</div>

              <div
                className={`dropdown-item ${activeModel === 'mabix-1.0' ? 'selected' : ''}`}
                onClick={() => {
                  onSelectModel('mabix-1.0');
                  setDropdownOpen(false);
                }}
              >
                <div className="item-radio">
                  <span className={`dot ${activeModel === 'mabix-1.0' ? 'active' : ''}`} />
                </div>
                <div className="item-content">
                  <div className="item-title-row">
                    <span className="item-title">MABIX 1.0 (core)</span>
                    <span className="item-tag speed">Lightning Fast</span>
                  </div>
                  <p className="item-desc">
                    Ultra-fast text, document analysis, and daily reasoning.
                  </p>
                </div>
              </div>

              <div
                className={`dropdown-item ultra ${activeModel === 'mabix-2.0-ultra' ? 'selected' : ''}`}
                onClick={() => {
                  onSelectModel('mabix-2.0-ultra');
                  setDropdownOpen(false);
                }}
              >
                <div className="item-radio">
                  <span className={`dot gold ${activeModel === 'mabix-2.0-ultra' ? 'active' : ''}`} />
                </div>
                <div className="item-content">
                  <div className="item-title-row">
                    <span className="item-title gold-text">MABIX 2.0 (core ultra)</span>
                    <span className="item-tag ultra">ULTRA • STUDIO</span>
                  </div>
                  <p className="item-desc">
                    Photo Studio editing, background removal, scenic swap, and deep multimodal intelligence.
                  </p>
                </div>
              </div>

              <div
                className={`dropdown-item apex ${activeModel === 'mabix-3.0-apex' ? 'selected' : ''}`}
                onClick={() => {
                  onSelectModel('mabix-3.0-apex');
                  setDropdownOpen(false);
                }}
              >
                <div className="item-radio">
                  <span className={`dot cyan ${activeModel === 'mabix-3.0-apex' ? 'active' : ''}`} />
                </div>
                <div className="item-content">
                  <div className="item-title-row">
                    <span className="item-title cyan-text">MABIX 3.0 CORE (APEX)</span>
                    <span className="item-tag apex">NEW • OPUS 5.5</span>
                  </div>
                  <p className="item-desc">
                    Jarvis AI voice assistant, holographic HUD terminal, Arc Reactor core, web search, timers & deep coding.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
