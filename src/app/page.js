'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import WelcomeScreen from '@/components/WelcomeScreen';
import ChatArea from '@/components/ChatArea';
import MessageInput from '@/components/MessageInput';
import PhotoEditorModal from '@/components/PhotoEditorModal';

const STORAGE_KEY = 'MABIX_chats';
const MODEL_STORAGE_KEY = 'MABIX_active_model';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createNewChatObj(title = 'New Chat') {
  return {
    id: generateId(),
    title,
    messages: [],
    createdAt: Date.now(),
  };
}

export default function Home() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // MABIX Engine State: 'mabix-1.0' vs 'mabix-2.0-ultra'
  const [activeModel, setActiveModel] = useState('mabix-1.0');

  // Imagine Photo Studio Modal State
  const [isImagineOpen, setIsImagineOpen] = useState(false);
  const [imagineInitialImage, setImagineInitialImage] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setIsSidebarOpen(window.innerWidth > 768);
      }
      const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      if (savedModel) setActiveModel(savedModel);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chats && parsed.chats.length > 0) {
          setChats(parsed.chats);
          setActiveChatId(parsed.activeChatId || parsed.chats[0].id);
        } else {
          const welcome = createNewChatObj('Welcome Chat');
          setChats([welcome]);
          setActiveChatId(welcome.id);
        }
      } else {
        const welcome = createNewChatObj('Welcome Chat');
        setChats([welcome]);
        setActiveChatId(welcome.id);
      }
    } catch {
      const welcome = createNewChatObj('Welcome Chat');
      setChats([welcome]);
      setActiveChatId(welcome.id);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, activeModel);

      const storageChats = chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((m) => {
          if (m.attachments && m.attachments.length > 0) {
            return {
              ...m,
              attachments: m.attachments.map((a) => ({
                id: a.id,
                name: a.name,
                size: a.size,
                type: a.type,
                isImage: a.isImage,
                dataUrl: a.dataUrl && a.dataUrl.length < 500000 ? a.dataUrl : undefined,
                textContent: a.textContent && a.textContent.length < 10000 ? a.textContent : undefined,
              })),
            };
          }
          return m;
        }),
      }));

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ chats: storageChats, activeChatId })
      );
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }
  }, [chats, activeChatId, activeModel, isHydrated]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const createNewChat = useCallback(() => {
    const newChat = createNewChatObj('New Chat');
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsSidebarOpen(false);
  }, []);

  const selectChat = useCallback((id) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  }, []);

  const deleteChat = useCallback(
    (id) => {
      setChats((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (filtered.length === 0) {
          const welcome = createNewChatObj('Welcome Chat');
          setActiveChatId(welcome.id);
          return [welcome];
        }
        if (activeChatId === id) {
          setActiveChatId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeChatId]
  );

  const handleOpenImagine = useCallback((image = null) => {
    setImagineInitialImage(image);
    setIsImagineOpen(true);
    setIsSidebarOpen(false);
  }, []);

  const handleSelectModel = useCallback((modelId) => {
    setActiveModel(modelId);
  }, []);

  const handleToggleUpgrade = useCallback(() => {
    setActiveModel((prev) =>
      prev === 'mabix-2.0-ultra' ? 'mabix-1.0' : 'mabix-2.0-ultra'
    );
  }, []);

  const sendMessage = useCallback(
    async (text, attachments = []) => {
      const trimmed = (text || '').trim();
      if ((!trimmed && attachments.length === 0) || isLoading || !activeChatId) return;

      const userMessage = {
        role: 'user',
        content: trimmed,
        attachments: attachments,
        timestamp: Date.now(),
      };

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;
          const updated = {
            ...chat,
            messages: [...chat.messages, userMessage],
          };
          if (chat.messages.filter((m) => m.role === 'user').length === 0) {
            const titleSource = trimmed || attachments[0]?.name || 'New Conversation';
            updated.title = titleSource.slice(0, 35) + (titleSource.length > 35 ? '...' : '');
          }
          return updated;
        })
      );

      setIsLoading(true);

      try {
        const currentChat = chats.find((c) => c.id === activeChatId);
        const allMessages = [
          ...(currentChat?.messages || []),
          userMessage,
        ].map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            model: activeModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botText = '';

        const botTimestamp = Date.now();
        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== activeChatId) return chat;
            return {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  role: 'assistant',
                  content: '',
                  timestamp: botTimestamp,
                },
              ],
            };
          })
        );

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              const jsonStr = trimmedLine.slice(6);
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.text) {
                  botText += parsed.text;

                  setChats((prev) =>
                    prev.map((chat) => {
                      if (chat.id !== activeChatId) return chat;
                      const msgs = [...chat.messages];
                      const lastIdx = msgs.length - 1;
                      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                        msgs[lastIdx] = {
                          ...msgs[lastIdx],
                          content: botText,
                        };
                      }
                      return { ...chat, messages: msgs };
                    })
                  );
                }
              } catch {
                // Skip partial JSON
              }
            }
          }
        }

        if (!botText) {
          setChats((prev) =>
            prev.map((chat) => {
              if (chat.id !== activeChatId) return chat;
              const msgs = [...chat.messages];
              const lastIdx = msgs.length - 1;
              if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                msgs[lastIdx] = {
                  ...msgs[lastIdx],
                  content:
                    "I'm sorry, I couldn't generate a response. Please try again.",
                };
              }
              return { ...chat, messages: msgs };
            })
          );
        }
      } catch (error) {
        console.error('Send message error:', error);
        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== activeChatId) return chat;
            const msgs = [...chat.messages];
            const lastIdx = msgs.length - 1;
            if (
              lastIdx >= 0 &&
              msgs[lastIdx].role === 'assistant' &&
              !msgs[lastIdx].content
            ) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
              };
            } else {
              msgs.push({
                role: 'assistant',
                content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
                timestamp: Date.now(),
              });
            }
            return { ...chat, messages: msgs };
          })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeChatId, activeModel, chats, isLoading]
  );

  const handleInsertEditedPhoto = useCallback(
    (dataUrl, prompt) => {
      const photoAttachment = {
        id: generateId(),
        name: 'MABIX-Edited-Photo.png',
        size: Math.round(dataUrl.length * 0.75),
        type: 'image/png',
        isImage: true,
        dataUrl: dataUrl,
      };
      sendMessage(prompt || 'Analyze this edited photo created with MABIX 2.0 Core Ultra.', [photoAttachment]);
    },
    [sendMessage]
  );

  const handleSuggestionClick = useCallback(
    (text) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const handleOpenTasks = useCallback(() => {
    sendMessage('Help me create and organize a structured, actionable task list and milestone roadmap for my current goals.');
    setIsSidebarOpen(false);
  }, [sendMessage]);

  const handleOpenProjects = useCallback(() => {
    sendMessage('I want to start a new project. Help me define the scope, tech stack, architecture, and step-by-step roadmap.');
    setIsSidebarOpen(false);
  }, [sendMessage]);

  const handleOpenDiscover = useCallback(() => {
    sendMessage('Show me what advanced capabilities MABIX 2.0 Core Ultra offers, including photo editing, deep reasoning, and multimodal tools.');
    setIsSidebarOpen(false);
  }, [sendMessage]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  if (!isHydrated) {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  const hasMessages = activeChat && activeChat.messages.length > 0;
  const isUltra = activeModel === 'mabix-2.0-ultra';

  return (
    <div className={`app-container ${isUltra ? 'ultra-mode' : ''}`}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onOpenImagine={() => handleOpenImagine()}
        onOpenTasks={handleOpenTasks}
        onOpenProjects={handleOpenProjects}
        onOpenDiscover={handleOpenDiscover}
        activeModel={activeModel}
        onToggleUpgrade={handleToggleUpgrade}
      />

      <main className={`main-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          activeModel={activeModel}
          onSelectModel={handleSelectModel}
          onOpenImagine={() => handleOpenImagine()}
        />

        {hasMessages ? (
          <ChatArea messages={activeChat.messages} isLoading={isLoading} />
        ) : (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        )}

        <MessageInput
          onSend={sendMessage}
          isLoading={isLoading}
          onOpenImagineWithImage={(img) => handleOpenImagine(img)}
          activeModel={activeModel}
        />
      </main>

      {/* Imagine Photo Studio Modal */}
      <PhotoEditorModal
        isOpen={isImagineOpen}
        onClose={() => setIsImagineOpen(false)}
        onInsertToChat={handleInsertEditedPhoto}
        initialImage={imagineInitialImage}
      />
    </div>
  );
}
