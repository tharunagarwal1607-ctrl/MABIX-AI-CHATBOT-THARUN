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
  onOpenLibrary,
  onOpenTasks,
  onOpenProjects,
  onOpenDiscover,
  activeModel = 'mabix-1.0',
  onToggleUpgrade,
}) {
  const isUltra = activeModel === 'mabix-2.0-ultra';

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'} ${isUltra ? 'ultra-sidebar' : 'classic-sidebar'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="MABIX Logo" className="sidebar-logo-img" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">MABIX</span>
              <span className="sidebar-brand-tagline">
                {isUltra ? '2.0 CORE ULTRA' : 'AI FOR YOUR JOURNEY'}
              </span>
            </div>
          </div>
          <button className="sidebar-collapse-btn" onClick={onToggle} title="Collapse sidebar">
            ◫
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MABIX 2.0 CORE ULTRA: Copilot-Style Navigation Suite               */}
        {/* ------------------------------------------------------------------ */}
        {isUltra ? (
          <div className="sidebar-nav-section">
            <button className="sidebar-nav-item primary" onClick={onNewChat}>
              <span className="nav-item-icon">📝</span>
              <span className="nav-item-text">New chat</span>
            </button>

            <button className="sidebar-nav-item" onClick={onOpenLibrary}>
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
        ) : (
          /* ------------------------------------------------------------------ */
          /* MABIX 1.0 CORE: Classic New Chat Button                            */
          /* ------------------------------------------------------------------ */
          <div className="classic-new-chat-wrapper" style={{ padding: '12px 14px 4px' }}>
            <button className="new-chat-btn" onClick={onNewChat}>
              <span className="plus-icon">+</span> New Chat
            </button>
          </div>
        )}

        <div className="sidebar-divider" />

        {/* Recent Conversations */}
        <div className="sidebar-chats">
          <div className="chats-label">
            {isUltra ? 'Recent Chats' : 'Recent Conversations'}
          </div>
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

        {/* ------------------------------------------------------------------ */}
        {/* Footer: Copilot Profile (Ultra) vs Classic Profile (1.0 Core)      */}
        {/* ------------------------------------------------------------------ */}
        <div className="sidebar-footer">
          {isUltra ? (
            <div className="user-profile-copilot">
              <div className="user-avatar-circle">
                <span>T</span>
              </div>
              <div className="user-details">
                <span className="user-name-bold">THARUN</span>
                <span className="user-plan-label">MABIX 2.0 Ultra</span>
              </div>
              <button
                type="button"
                className="upgrade-pill-btn active-ultra"
                onClick={onToggleUpgrade}
                title="Switch back to MABIX 1.0 (core)"
              >
                ULTRA
              </button>
            </div>
          ) : (
            <div className="user-profile">
              <img src="/logo.png" alt="Tharun Thangadi" className="user-avatar-img" />
              <div className="profile-info">
                <span className="user-name">Tharun Thangadi</span>
                <span className="user-model-badge">Creator &bull; MABIX 1.0</span>
              </div>
            </div>
          )}
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
