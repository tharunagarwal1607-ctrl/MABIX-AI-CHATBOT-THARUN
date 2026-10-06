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
  onSelectModel,
  onToggleUpgrade,
}) {
  const isApex = activeModel === 'mabix-3.0-apex';
  const isUltra = activeModel === 'mabix-2.0-ultra';

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? 'open' : 'collapsed'} ${
          isApex ? 'apex-sidebar' : isUltra ? 'ultra-sidebar' : 'classic-sidebar'
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="MABIX Logo" className="sidebar-logo-img" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">MABIX</span>
              <span className="sidebar-brand-tagline">
                {isApex
                  ? '3.0 CORE (APEX)'
                  : isUltra
                  ? '2.0 CORE ULTRA'
                  : 'AN INTELLIGENCE BOT'}
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
            {isApex ? 'Apex Command History' : isUltra ? 'Recent Chats' : 'Recent Conversations'}
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
        {/* Footer: User Profile & Active Tier Badge                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="sidebar-footer">
          {isApex ? (
            <div className="user-profile-copilot apex-footer">
              <div className="user-avatar-circle apex-circle">
                <span>J</span>
              </div>
              <div className="user-details">
                <span className="user-name-bold">THARUN</span>
                <span className="user-plan-label">MABIX 3.0 APEX</span>
              </div>
              <button
                type="button"
                className="upgrade-pill-btn active-apex"
                onClick={() => onSelectModel && onSelectModel('mabix-2.0-ultra')}
                title="Switch back to 2.0 Ultra"
              >
                APEX
              </button>
            </div>
          ) : isUltra ? (
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
                onClick={() => onSelectModel && onSelectModel('mabix-3.0-apex')}
                title="Switch to MABIX 3.0 APEX"
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
