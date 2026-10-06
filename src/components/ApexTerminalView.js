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

  // Jarvis Local System Commands Evaluator
  const executeLocalJarvisCommand = (cmdText) => {
    const lower = cmdText.toLowerCase();

    // 1. Web search / app opening
    if (lower.startsWith('open youtube') || lower.includes('search youtube')) {
      const q = lower.replace(/open youtube|search youtube|on youtube/g, '').trim();
      const url = q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : 'https://www.youtube.com';
      window.open(url, '_blank');
      return `Opening YouTube ${q ? `for "${q}"` : ''}, sir.`;
    }

    if (lower.startsWith('open google') || lower.startsWith('search google for') || lower.startsWith('google ')) {
      const q = lower.replace(/open google|search google for|google/g, '').trim();
      const url = q ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : 'https://www.google.com';
      window.open(url, '_blank');
      return `Executing Google search for ${q || 'web queries'}, sir.`;
    }

    if (lower.includes('open github')) {
      window.open('https://github.com', '_blank');
      return 'Opening GitHub repository interface, sir.';
    }

    if (lower.includes('open wikipedia')) {
      const q = lower.replace(/open wikipedia|search wikipedia for/g, '').trim();
      const url = q ? `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}` : 'https://www.wikipedia.org';
      window.open(url, '_blank');
      return `Accessing Wikipedia archives for ${q || 'research'}, sir.`;
    }

    // 2. Play music
    if (lower.includes('play music') || lower.includes('play lofi') || lower.includes('play songs')) {
      window.open('https://www.youtube.com/results?search_query=lofi+hip+hop+radio', '_blank');
      return 'Initializing audio entertainment stream on YouTube Music, sir.';
    }

    // 3. Set timer
    const timerMatch = lower.match(/set (?:a )?timer (?:for )?(\d+)\s*(min|minute|sec|second)/);
    if (timerMatch) {
      const val = parseInt(timerMatch[1], 10);
      const isMin = timerMatch[2].startsWith('min');
      const seconds = isMin ? val * 60 : val;
      setActiveTimers((prev) => [
        ...prev,
        { id: Date.now().toString(), label: `${val} ${timerMatch[2]}`, remaining: seconds },
      ]);
      return `Timer armed for ${val} ${timerMatch[2]}s, sir. Telemetry active.`;
    }

    // 4. System diagnostics
    if (lower.includes('system diagnostic') || lower.includes('system status') || lower.includes('status report')) {
      return 'All systems nominal. Neural core operational at 98% efficiency. 16 compute cores synchronized. Network throughput: 100 Mb/s. MK VI Interface fully armed.';
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
      setTimeout(() => {
        setCommsLog((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'JARVIS',
            time: new Date().toTimeString().split(' ')[0],
            type: 'bot',
            text: localResult,
          },
        ]);
        speakResponse(localResult);
      }, 300);
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
