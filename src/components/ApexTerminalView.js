'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function ApexTerminalView({
  onSendMessage,
  activeModel,
  onSelectModel,
  onBackToChat,
}) {
  // Clock & Time States
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState(1);
  const [cmdCount, setCmdCount] = useState(4);

  // Jarvis System States
  const [jarvisState, setJarvisState] = useState('STANDBY'); // STANDBY | LISTENING | PROCESSING | SPEAKING
  const [inputCmd, setInputCmd] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [activeTimers, setActiveTimers] = useState([]);

  // Comms Log Terminal Messages
  const [commsLog, setCommsLog] = useState([
    {
      id: '1',
      sender: 'SYSTEM',
      time: '19:17:08',
      type: 'system',
      text: 'Interface initialized - MK VI Neural Voice Core online.',
    },
    {
      id: '2',
      sender: 'SYSTEM',
      time: '19:17:10',
      type: 'system',
      text: 'Neural weights cached: MABIX 3.0 APEX (Opus 5.5 Tier). Full capabilities armed.',
    },
    {
      id: '3',
      sender: 'JARVIS',
      time: '19:17:12',
      type: 'bot',
      text: 'Good evening. J.A.R.V.I.S. online. All systems nominal. I am running the MABIX 3.0 APEX reasoning core created by Tharun Thangadi. Voice synthesis, deep coding, web search, and subsystem controls are ready. How may I assist you, sir?',
    },
  ]);

  const recognitionRef = useRef(null);
  const commsEndRef = useRef(null);

  // Auto-scroll comms log
  useEffect(() => {
    commsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commsLog]);

  // Live Digital Clock & Day calculation matching screenshot
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);

      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      setDateStr(
        `${days[now.getDay()]}, ${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()} • DAY ${dayOfYear} • UTC+5.5`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    const uptimeInterval = setInterval(() => setSessionMinutes((prev) => prev + 1), 60000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    };
  }, []);

  // Timer countdown handler
  useEffect(() => {
    if (activeTimers.length === 0) return;
    const tInterval = setInterval(() => {
      setActiveTimers((prev) =>
        prev
          .map((t) => ({ ...t, remaining: t.remaining - 1 }))
          .filter((t) => {
            if (t.remaining <= 0) {
              speakResponse(`Timer completed for ${t.label || 'task'}.`);
              return false;
            }
            return true;
          })
      );
    }, 1000);
    return () => clearInterval(tInterval);
  }, [activeTimers]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setJarvisState('LISTENING');
        };

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputCmd(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
          setJarvisState((prev) => (prev === 'LISTENING' ? 'STANDBY' : prev));
        };

        recognition.onerror = () => {
          setIsListening(false);
          setJarvisState('STANDBY');
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Text-To-Speech (SpeechSynthesis)
  const speakResponse = useCallback(
    (text) => {
      if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      // Clean markdown tags for natural speech
      const cleanText = text
        .replace(/[*_#`~\[\]\(\)>]/g, ' ')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Male')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setJarvisState('SPEAKING');
      utterance.onend = () => setJarvisState('STANDBY');
      utterance.onerror = () => setJarvisState('STANDBY');

      window.speechSynthesis.speak(utterance);
    },
    [speechEnabled]
  );

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setJarvisState('STANDBY');
    } else {
      try {
        recognitionRef.current?.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const openExternalUrl = (url) => {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.warn('Window open fallback error:', e);
    }
  };

  // Jarvis Local System Commands Evaluator — Immediate execution & zero unnecessary chatter
  const executeLocalJarvisCommand = (cmdText) => {
    const raw = cmdText.trim();
    const lower = raw.toLowerCase();

    // 1. YouTube — Immediately open, concise & direct response
    if (lower.includes('youtube') || lower.includes('open yt') || lower === 'yt') {
      let q = lower
        .replace(/jarvis/gi, '')
        .replace(/can you/gi, '')
        .replace(/could you/gi, '')
        .replace(/please/gi, '')
        .replace(/open youtube and (search for|search|play)/gi, '')
        .replace(/open youtube (to|and)?/gi, '')
        .replace(/search (for )?on youtube/gi, '')
        .replace(/search youtube (for )?/gi, '')
        .replace(/open youtube/gi, '')
        .replace(/launch youtube/gi, '')
        .replace(/open yt/gi, '')
        .replace(/on youtube/gi, '')
        .replace(/youtube/gi, '')
        .replace(/play/gi, '')
        .trim();

      const url = q
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
        : 'https://www.youtube.com';
      openExternalUrl(url);
      return {
        text: q ? `Opening YouTube for "${q}".` : 'Opening YouTube, sir.',
        actionUrl: url,
        actionLabel: 'YouTube',
      };
    }

    // 2. Chrome / Browser — Immediately open Chrome / Google
    if (
      lower.includes('chrome') ||
      lower.includes('browser') ||
      lower.includes('google chrome') ||
      lower === 'open chrome' ||
      lower === 'launch chrome'
    ) {
      const url = 'https://www.google.com';
      openExternalUrl(url);
      return {
        text: 'Opening Google Chrome, sir.',
        actionUrl: url,
        actionLabel: 'Google Chrome',
      };
    }

    // 3. Google Search
    if (lower.includes('google') || lower.startsWith('search for ')) {
      let q = lower
        .replace(/jarvis|can you|could you|please|open google|search google for|search google|search for|google/gi, '')
        .trim();
      const url = q ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : 'https://www.google.com';
      openExternalUrl(url);
      return {
        text: q ? `Searching Google for "${q}".` : 'Opening Google, sir.',
        actionUrl: url,
        actionLabel: 'Google Search',
      };
    }

    // 4. GitHub
    if (lower.includes('github')) {
      const url = 'https://github.com';
      openExternalUrl(url);
      return {
        text: 'Opening GitHub, sir.',
        actionUrl: url,
        actionLabel: 'GitHub',
      };
    }

    // 5. Wikipedia
    if (lower.includes('wikipedia')) {
      let q = lower
        .replace(/jarvis|can you|could you|please|open wikipedia|search wikipedia for|search wikipedia|wikipedia/gi, '')
        .trim();
      const url = q
        ? `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`
        : 'https://www.wikipedia.org';
      openExternalUrl(url);
      return {
        text: q ? `Accessing Wikipedia archives for "${q}".` : 'Opening Wikipedia, sir.',
        actionUrl: url,
        actionLabel: 'Wikipedia',
      };
    }

    // 6. Gmail / Email
    if (lower.includes('gmail') || lower.includes('email') || lower.includes('mail')) {
      const url = 'https://mail.google.com';
      openExternalUrl(url);
      return {
        text: 'Opening Gmail, sir.',
        actionUrl: url,
        actionLabel: 'Gmail',
      };
    }

    // 7. Maps
    if (lower.includes('maps') || lower.includes('google maps')) {
      const url = 'https://maps.google.com';
      openExternalUrl(url);
      return {
        text: 'Opening Google Maps, sir.',
        actionUrl: url,
        actionLabel: 'Google Maps',
      };
    }

    // 8. WhatsApp
    if (lower.includes('whatsapp')) {
      const url = 'https://web.whatsapp.com';
      openExternalUrl(url);
      return {
        text: 'Opening WhatsApp Web, sir.',
        actionUrl: url,
        actionLabel: 'WhatsApp Web',
      };
    }

    // 9. Play music
    if (lower.includes('play music') || lower.includes('play song') || lower.includes('play songs') || lower.includes('play lofi')) {
      let song = lower.replace(/jarvis|can you|could you|please|play music|play song|play songs|play lofi|play/gi, '').trim();
      const url = song
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`
        : 'https://www.youtube.com/results?search_query=lofi+hip+hop+radio';
      openExternalUrl(url);
      return {
        text: song ? `Playing "${song}" on YouTube, sir.` : 'Playing music on YouTube, sir.',
        actionUrl: url,
        actionLabel: 'YouTube Music',
      };
    }

    // 10. Set timer
    const timerMatch = lower.match(/(?:set|start)(?: a)? timer (?:for )?(\d+)\s*(min|minute|sec|second)/i);
    if (timerMatch) {
      const val = parseInt(timerMatch[1], 10);
      const isMin = timerMatch[2].toLowerCase().startsWith('min');
      const seconds = isMin ? val * 60 : val;
      setActiveTimers((prev) => [
        ...prev,
        { id: Date.now().toString(), label: `${val} ${timerMatch[2]}`, remaining: seconds },
      ]);
      return {
        text: `Timer set for ${val} ${timerMatch[2]}.`,
      };
    }

    // 11. System diagnostics
    if (lower.includes('system diagnostic') || lower.includes('system status') || lower.includes('status report')) {
      return {
        text: 'All systems nominal. Neural core operational at 98% efficiency. 16 cores synchronized. MK VI Interface online.',
      };
    }

    return null;
  };

  // Main Command Handler
  const handleSendCommand = async (e) => {
    e?.preventDefault();
    const cmd = inputCmd.trim();
    if (!cmd) return;

    setInputCmd('');
    setCmdCount((prev) => prev + 1);

    const nowTime = new Date().toTimeString().split(' ')[0];

    // Add user message to log
    setCommsLog((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'YOU',
        time: nowTime,
        type: 'user',
        text: cmd,
      },
    ]);

    // Check if it matches a local Jarvis action
    const localResult = executeLocalJarvisCommand(cmd);
    if (localResult) {
      const resText = typeof localResult === 'string' ? localResult : localResult.text;
      const actionUrl = typeof localResult === 'object' ? localResult.actionUrl : null;
      const actionLabel = typeof localResult === 'object' ? localResult.actionLabel : null;

      setCommsLog((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'JARVIS',
          time: new Date().toTimeString().split(' ')[0],
          type: 'bot',
          text: resText,
          actionUrl,
          actionLabel,
        },
      ]);
      speakResponse(resText);
      return;
    }

    // Otherwise, dispatch to MABIX 3.0 APEX AI engine (Opus 5.5 standard)
    setJarvisState('PROCESSING');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mabix-3.0-apex',
          messages: [{ role: 'user', content: cmd }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';
      let buffer = '';

      const botMsgId = (Date.now() + 1).toString();
      setCommsLog((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'JARVIS',
          time: new Date().toTimeString().split(' ')[0],
          type: 'bot',
          text: '',
        },
      ]);

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
                botResponse += parsed.text;
                setCommsLog((prev) =>
                  prev.map((m) => (m.id === botMsgId ? { ...m, text: botResponse } : m))
                );
              }
            } catch {
              // ignore partial
            }
          }
        }
      }

      setJarvisState('STANDBY');
      if (botResponse) {
        speakResponse(botResponse);
      }
    } catch (err) {
      setJarvisState('STANDBY');
      const errText = `Communication error: ${err.message || 'Server timeout'}. Neural bus rerouting.`;
      setCommsLog((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'JARVIS',
          time: new Date().toTimeString().split(' ')[0],
          type: 'error',
          text: errText,
        },
      ]);
      speakResponse(errText);
    }
  };

  const purgeLog = () => {
    setCommsLog([
      {
        id: Date.now().toString(),
        sender: 'SYSTEM',
        time: new Date().toTimeString().split(' ')[0],
        type: 'system',
        text: 'Comms log buffer purged. Neural registers cleared.',
      },
    ]);
  };

  return (
    <div className="apex-hud-viewport">
      {/* Top Header Bar matching Screenshot */}
      <header className="apex-hud-topbar">
        <div className="apex-topbar-left">
          <span className="apex-brand-title">J . A . R . V . I . S</span>
          <span className="apex-brand-sub">PERSONAL INTERFACE • MK VI • NEURAL VOICE CORE</span>
        </div>

        <div className="apex-topbar-center">
          <span className="apex-online-tag">INTERFACE ONLINE</span>
        </div>

        <div className="apex-topbar-right">
          {/* Controls: Audio, Speaker, Fullscreen, Model Switcher */}
          <button
            type="button"
            className={`apex-ctrl-btn ${speechEnabled ? 'active' : ''}`}
            onClick={() => setSpeechEnabled(!speechEnabled)}
            title={speechEnabled ? 'Mute Voice Output' : 'Enable Voice Output'}
          >
            {speechEnabled ? '🔊 VOICE ON' : '🔇 MUTED'}
          </button>

          <button
            type="button"
            className="apex-ctrl-btn"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            title="Toggle Fullscreen"
          >
            ⛶
          </button>

          <button
            type="button"
            className="apex-ctrl-btn model-quick-btn"
            onClick={() => onSelectModel && onSelectModel('mabix-2.0-ultra')}
            title="Switch to MABIX 2.0 Core Ultra"
          >
            ✨ 2.0 ULTRA
          </button>

          <button
            type="button"
            className="apex-ctrl-btn model-quick-btn"
            onClick={() => onSelectModel && onSelectModel('mabix-1.0')}
            title="Switch to MABIX 1.0 Core"
          >
            ⚡ 1.0 CORE
          </button>

          <button
            type="button"
            className="apex-ctrl-btn exit-apex-btn"
            onClick={onBackToChat}
            title="Exit HUD to Standard Chat"
          >
            ✕ EXIT HUD
          </button>
        </div>
      </header>

      {/* Main HUD Body: 3-column Layout */}
      <div className="apex-hud-body">
        {/* Left Telemetry Deck matching Screenshot */}
        <aside className="apex-left-deck">
          {/* 1. Local Time */}
          <div className="telemetry-box">
            <span className="telemetry-label">LOCAL TIME</span>
            <div className="telemetry-time-display">{timeStr}</div>
            <div className="telemetry-sub-meta">{dateStr}</div>
          </div>

          {/* 2. Neural Core */}
          <div className="telemetry-box">
            <span className="telemetry-label">NEURAL CORE</span>
            <div className="telemetry-row">
              <span>STATE</span>
              <span className="val-cyan">{jarvisState}</span>
            </div>
            <div className="telemetry-row">
              <span>MODEL</span>
              <span className="val-cyan">APEX 3.0 (OPUS)</span>
            </div>
            <div className="telemetry-row">
              <span>CONTEXT</span>
              <span className="val-cyan">128K</span>
            </div>
            <div className="telemetry-row">
              <span>SPEED</span>
              <span className="val-cyan">95 T/S</span>
            </div>
          </div>

          {/* 3. Voice Bus */}
          <div className="telemetry-box">
            <span className="telemetry-label">VOICE BUS</span>
            <div className="telemetry-row">
              <span>WAKE WORD</span>
              <span
                className={`val-toggle ${wakeWordActive ? 'active' : ''}`}
                onClick={() => setWakeWordActive(!wakeWordActive)}
              >
                {wakeWordActive ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="telemetry-row">
              <span>VOICE</span>
              <span className="val-cyan truncate">Jarvis Neural MK VI</span>
            </div>
            <div className="telemetry-row">
              <span>RATE</span>
              <span className="val-cyan">1.05x</span>
            </div>
            <div className="telemetry-row">
              <span>INPUT</span>
              <span className={isListening ? 'val-green' : 'val-cyan'}>
                {isListening ? 'LISTENING' : 'MIC READY'}
              </span>
            </div>
          </div>

          {/* 4. Subsystems */}
          <div className="telemetry-box">
            <span className="telemetry-label">SUBSYSTEMS</span>
            <div className="telemetry-row">
              <span>POWER</span>
              <span className="val-cyan">98%</span>
            </div>
            <div className="telemetry-progress-bar">
              <div className="telemetry-progress-fill" style={{ width: '98%' }}></div>
            </div>

            <div className="telemetry-row">
              <span>NETWORK</span>
              <span className="val-cyan">ONLINE • 100 Mb/s</span>
            </div>
            <div className="telemetry-row">
              <span>COMPUTE</span>
              <span className="val-cyan">16 CORES • 32GB RAM</span>
            </div>
            <div className="telemetry-row">
              <span>DISPLAY</span>
              <span className="val-cyan">1920x1080 @1.25x</span>
            </div>
            <div className="telemetry-row">
              <span>SESSION</span>
              <span className="val-cyan">
                UP {sessionMinutes}M • {cmdCount} CMD
              </span>
            </div>
          </div>

          {/* 5. Mic Frequency Visualizer Bars */}
          <div className="telemetry-box">
            <span className="telemetry-label">MIC INPUT</span>
            <div className="audio-visualizer-bars">
              {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 50, 60].map((h, i) => (
                <div
                  key={i}
                  className={`audio-bar ${isListening || jarvisState === 'SPEAKING' ? 'pulsing' : ''}`}
                  style={{
                    height: isListening || jarvisState === 'SPEAKING' ? `${h}%` : '15%',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 6. Active Timers */}
          <div className="telemetry-box">
            <span className="telemetry-label">ACTIVE TIMERS</span>
            {activeTimers.length > 0 ? (
              activeTimers.map((t) => (
                <div key={t.id} className="telemetry-row timer-item">
                  <span>{t.label}</span>
                  <span className="val-gold">
                    {Math.floor(t.remaining / 60)}:
                    {String(t.remaining % 60).padStart(2, '0')}
                  </span>
                </div>
              ))
            ) : (
              <div className="telemetry-sub-meta">none armed</div>
            )}
          </div>
        </aside>

        {/* Center Holographic Arc Reactor Core matching Screenshot */}
        <main className="apex-center-deck">
          <div className="arc-reactor-container">
            {/* Holographic Ring Structure */}
            <div className={`arc-ring outer-ring ${jarvisState === 'PROCESSING' ? 'fast-spin' : ''}`} />
            <div className="arc-ring tick-ring" />
            <div className="arc-ring middle-ring" />
            <div className="arc-ring inner-ring" />

            {/* Glowing Hexagonal / Core Center */}
            <div className="arc-core-shield">
              <div className="arc-core-pulse" />
              <div className="arc-core-text">{jarvisState}</div>
            </div>
          </div>

          {/* Coordinates Overlay matching Screenshot */}
          <div className="apex-coordinates-bar">
            <span>X 0358 • Y 0557</span>
          </div>

          {/* Interactive Suggestions */}
          <div className="apex-suggestions-row">
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => setInputCmd('Run system diagnostic and verify neural subroutines')}
            >
              TRY "SYSTEM DIAGNOSTIC"
            </button>
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => setInputCmd('Open YouTube and search for quantum mechanics')}
            >
              TRY "OPEN YOUTUBE"
            </button>
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => setInputCmd('Set a timer for 5 minutes')}
            >
              TRY "SET TIMER 5 MIN"
            </button>
          </div>
        </main>

        {/* Right Comms Log Terminal matching Screenshot */}
        <aside className="apex-right-deck">
          <div className="comms-log-header">
            <span className="comms-title">COMMS LOG</span>
            <button type="button" className="comms-purge-btn" onClick={purgeLog}>
              PURGE
            </button>
          </div>

          <div className="comms-log-stream">
            {commsLog.map((log) => (
              <div key={log.id} className={`comms-entry ${log.type}`}>
                <div className="comms-meta">
                  <span className="comms-sender">{log.sender}</span>
                  <span className="comms-time">{log.time}</span>
                </div>
                <div className="comms-text">{log.text}</div>
                {log.actionUrl && (
                  <div className="comms-action-wrapper" style={{ marginTop: '6px' }}>
                    <a
                      href={log.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comms-action-link-btn"
                      title={`Open ${log.actionLabel || 'Link'}`}
                    >
                      ↗ Launch {log.actionLabel || 'App'}
                    </a>
                  </div>
                )}
              </div>
            ))}
            <div ref={commsEndRef} />
          </div>
        </aside>
      </div>

      {/* Bottom Command Bar matching Screenshot */}
      <footer className="apex-hud-footer">
        <form onSubmit={handleSendCommand} className="apex-cmd-form">
          <button
            type="button"
            className={`apex-mic-trigger ${isListening ? 'listening' : ''}`}
            onClick={toggleMic}
            title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
          >
            🎙️
          </button>

          <input
            type="text"
            className="apex-cmd-input"
            placeholder="Ask me anything..."
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
          />

          <button type="submit" className="apex-send-btn" title="Send Command">
            →
          </button>
        </form>

        <div className="apex-ambient-control">
          <label className="ambient-checkbox-label">
            <input
              type="checkbox"
              checked={ambientAudio}
              onChange={(e) => setAmbientAudio(e.target.checked)}
            />
            <span>AMBIENT</span>
          </label>
        </div>
      </footer>
    </div>
  );
}
