'use client';

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onToggle,
  onOpenImagine,
  onOpenTasks,
  onOpenProjects,
  onOpenDiscover,
  activeModel,
  onToggleUpgrade,
}) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        {/* Header matching Copilot / MABIX style */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="MABIX Logo" className="sidebar-logo-img" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">MABIX</span>
              <span className="sidebar-brand-tagline">AI FOR YOUR JOURNEY</span>
            </div>
          </div>
          <button className="sidebar-collapse-btn" onClick={onToggle} title="Collapse sidebar">
            ◫
          </button>
        </div>

        {/* Copilot-Style Navigation Items */}
        <div className="sidebar-nav-section">
          <button className="sidebar-nav-item primary" onClick={onNewChat}>
            <span className="nav-item-icon">📝</span>
            <span className="nav-item-text">New chat</span>
          </button>

          <button className="sidebar-nav-item" onClick={onOpenTasks}>
            <span className="nav-item-icon">🗂️</span>
            <span className="nav-item-text">Library</span>
          </button>

          <button className="sidebar-nav-item" onClick={onOpenTasks}>
            <span className="nav-item-icon">☑️</span>
            <span className="nav-item-text">Tasks</span>
            <span className="nav-item-badge">PREVIEW</span>
          </button>

          <button className="sidebar-nav-item" onClick={onOpenProjects}>
            <span className="nav-item-icon">📁</span>
            <span className="nav-item-text">Projects</span>
            <span className="nav-item-action-icon">+</span>
          </button>

          <div className="sidebar-nav-divider" />

          <button className="sidebar-nav-item" onClick={onOpenDiscover}>
            <span className="nav-item-icon">🧭</span>
            <span className="nav-item-text">Discover</span>
          </button>

          <button className="sidebar-nav-item highlight-ultra" onClick={onOpenImagine}>
            <span className="nav-item-icon">🎞️</span>
            <span className="nav-item-text">Imagine</span>
            <span className="nav-item-ultra-tag">PHOTO STUDIO</span>
          </button>

          <button className="sidebar-nav-item" onClick={onToggleUpgrade}>
            <span className="nav-item-icon">🎛️</span>
            <span className="nav-item-text">Experiments</span>
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Recent Conversations */}
        <div className="sidebar-chats">
          <div className="chats-label">Recent Chats</div>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="chat-icon">💬</span>
              <span className="chat-title">{chat.title}</span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* User Profile Footer matching reference image */}
        <div className="sidebar-footer">
          <div className="user-profile-copilot">
            <div className="user-avatar-circle">
              <span>T</span>
            </div>
            <div className="user-details">
              <span className="user-name-bold">THARUN</span>
              <span className="user-plan-label">
                {activeModel === 'mabix-2.0-ultra' ? 'MABIX 2.0 Ultra' : 'Free Plan • Creator'}
              </span>
            </div>
            <button
              type="button"
              className={`upgrade-pill-btn ${activeModel === 'mabix-2.0-ultra' ? 'active-ultra' : ''}`}
              onClick={onToggleUpgrade}
              title="Toggle MABIX 2.0 CORE ULTRA"
            >
              {activeModel === 'mabix-2.0-ultra' ? 'ULTRA' : 'Upgrade'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      />
    </>
  );
}
