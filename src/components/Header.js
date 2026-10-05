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
          {isUltra && <span className="header-ultra-pill">2.0 ULTRA</span>}
        </div>
      </div>

      <div className="header-right">
        {/* Quick Imagine Photo Studio Shortcut */}
        <button
          type="button"
          className="header-imagine-btn"
          onClick={onOpenImagine}
          title="Open Imagine Photo Studio (Background Removal & Scene Swap)"
        >
          <span className="btn-icon">🎞️</span>
          <span className="btn-text">Imagine Studio</span>
        </button>

        {/* Model Selector Dropdown */}
        <div className="model-selector-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className={`model-selector ${isUltra ? 'ultra-active' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Select AI Engine"
          >
            <span className={`model-status-dot ${isUltra ? 'gold' : 'purple'}`}></span>
            <span className="model-name">
              {isUltra ? 'MABIX 2.0 (core ultra)' : 'MABIX 1.0 (core)'}
            </span>
            <span className="dropdown-arrow">{dropdownOpen ? '▴' : '▾'}</span>
          </button>

          {dropdownOpen && (
            <div className="model-dropdown-menu">
              <div className="dropdown-header">Select MABIX Engine</div>

              <div
                className={`dropdown-item ${!isUltra ? 'selected' : ''}`}
                onClick={() => {
                  onSelectModel('mabix-1.0');
                  setDropdownOpen(false);
                }}
              >
                <div className="item-radio">
                  <span className={`dot ${!isUltra ? 'active' : ''}`} />
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
                className={`dropdown-item ultra ${isUltra ? 'selected' : ''}`}
                onClick={() => {
                  onSelectModel('mabix-2.0-ultra');
                  setDropdownOpen(false);
                }}
              >
                <div className="item-radio">
                  <span className={`dot gold ${isUltra ? 'active' : ''}`} />
                </div>
                <div className="item-content">
                  <div className="item-title-row">
                    <span className="item-title gold-text">MABIX 2.0 (core ultra)</span>
                    <span className="item-tag ultra">NEW • ULTRA</span>
                  </div>
                  <p className="item-desc">
                    Photo Studio editing, background removal, scenic swap, and deep multimodal intelligence.
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
