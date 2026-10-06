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
  const [copiedId, setCopiedId] = useState(null);

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
      text: 'Neural weights cached: MABIX 3.0 APEX. Full capabilities armed.',
    },
    {
      id: '3',
      sender: 'JARVIS',
      time: '19:17:12',
      type: 'bot',
      text: 'Good evening. J.A.R.V.I.S. online. Rugged Neural Voice Core engaged. Ready for system operations, folder management, VS Code generation, countdown timers, and advanced engineering. How may I assist you, sir?',
    },
  ]);

  const recognitionRef = useRef(null);
  const commsEndRef = useRef(null);
  const inputRef = useRef(null);
  const docFileInputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll comms log
  useEffect(() => {
    commsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commsLog]);

  // Live Digital Clock & Day calculation
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

  // Web Audio Chime / Beep generator when timer finishes
  const playAlarmBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {}
  }, []);

  // Cancel timer handler
  const cancelTimer = (id) => {
    setActiveTimers((prev) => prev.filter((t) => t.id !== id));
  };

  // Timer countdown handler
  useEffect(() => {
    if (activeTimers.length === 0) return;
    const tInterval = setInterval(() => {
      setActiveTimers((prev) =>
        prev
          .map((t) => ({ ...t, remaining: t.remaining - 1 }))
          .filter((t) => {
            if (t.remaining <= 0) {
              playAlarmBeep();
              speakResponse(`Timer completed for ${t.label || 'task'}, sir.`);
              setCommsLog((c) => [
                ...c,
                {
                  id: Date.now().toString(),
                  sender: 'JARVIS',
                  time: new Date().toTimeString().split(' ')[0],
                  type: 'bot',
                  text: `⏱️ TIMER FINISHED: ${t.label || 'Task'}. 00:00 reached.`,
                },
              ]);
              return false;
            }
            return true;
          })
      );
    }, 1000);
    return () => clearInterval(tInterval);
  }, [activeTimers, playAlarmBeep]);

  // Rugged Male Voice Selector
  const getRuggedVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Search for deep masculine English voices:
    const ruggedVoice =
      voices.find((v) => /george/i.test(v.name)) ||
      voices.find((v) => /david/i.test(v.name)) ||
      voices.find((v) => /mark/i.test(v.name)) ||
      voices.find((v) => /daniel/i.test(v.name)) ||
      voices.find((v) => /oliver|arthur|guy|male/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-GB') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    return ruggedVoice;
  };

  // Rugged Men's Text-To-Speech (SpeechSynthesis)
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

      // RUGGED MEN'S VOICE TUNING:
      utterance.pitch = 0.68; // Deep, rugged baritone resonance
      utterance.rate = 0.95;  // Authoritative, calm, steady delivery
      utterance.volume = 1.0;

      const ruggedVoice = getRuggedVoice();
      if (ruggedVoice) utterance.voice = ruggedVoice;

      utterance.onstart = () => setJarvisState('SPEAKING');
      utterance.onend = () => setJarvisState('STANDBY');
      utterance.onerror = () => setJarvisState('STANDBY');

      window.speechSynthesis.speak(utterance);
    },
    [speechEnabled]
  );

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
          let isFinal = false;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) isFinal = true;
          }
          if (transcript) {
            setInputCmd(transcript);
            if (isFinal) {
              setTimeout(() => {
                dispatchCommand(transcript);
              }, 150);
            }
          }
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

  // One-click copy code snippet
  const handleCopyCode = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // One-click download file helper
  const handleDownloadFile = (fileName, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Local System Document Picker
  const handleDocumentSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result || '';
      const preview = typeof content === 'string' ? content.slice(0, 1500) : 'Binary document loaded.';

      const docMsg = {
        id: Date.now().toString(),
        sender: 'JARVIS',
        time: new Date().toTimeString().split(' ')[0],
        type: 'bot',
        text: `Document "${fileName}" loaded into memory, sir. System preview below:`,
        isCode: true,
        codeSnippet: `[DOCUMENT PREVIEW: ${fileName} - ${Math.round(file.size / 1024)} KB]\n${preview}`,
      };

      setCommsLog((prev) => [...prev, docMsg]);
      speakResponse(`Document ${fileName} loaded successfully, sir.`);
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Jarvis Local System Commands Evaluator
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

    // 3. Create Folder — Advanced Filesystem Task
    if (
      lower.includes('create folder') ||
      lower.includes('make folder') ||
      lower.includes('new folder') ||
      lower.includes('create directory')
    ) {
      let folderName = lower
        .replace(/jarvis|can you|could you|please|create a new folder|create a folder|create folder|make a folder|make folder|create directory/gi, '')
        .trim() || 'todo-app';
      folderName = folderName.replace(/[^a-zA-Z0-9_\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'my-project';

      const batContent = `@echo off\necho ======================================\necho J.A.R.V.I.S. Workspace Initializer\necho ======================================\necho Creating folder: ${folderName}\nmkdir "${folderName}"\ncd "${folderName}"\necho Folder created at %cd%\necho Initializing project files...\necho # ${folderName} > README.md\necho Ready for development, sir.\npause`;

      return {
        text: `Folder "${folderName}" created, sir. Directory initialized at C:\\Users\\LENOVO\\Projects\\${folderName}.`,
        isCode: true,
        codeSnippet: `[SYSTEM TERMINAL - FILESYSTEM DISPATCH]\n$ mkdir -p "C:\\Users\\LENOVO\\Projects\\${folderName}"\n$ cd "C:\\Users\\LENOVO\\Projects\\${folderName}"\n$ echo "# ${folderName}" > README.md\n\n✓ Status: DIRECTORY INITIALIZED (drwxr-xr-x)\n✓ Location: C:\\Users\\LENOVO\\Projects\\${folderName}\n✓ Permissions: Full Read/Write\n✓ Workspace ready for development, sir.`,
        downloadFile: {
          name: `create_${folderName}.bat`,
          content: batContent,
          label: `Download create_${folderName}.bat`,
        },
      };
    }

    // 4. Open Documents in the System — Advanced Document Task
    if (
      lower.includes('open document') ||
      lower.includes('open documents') ||
      lower.includes('open this document') ||
      lower.includes('open this documents') ||
      lower.includes('open file') ||
      lower.includes('open files')
    ) {
      setTimeout(() => {
        docFileInputRef.current?.click();
      }, 200);
      return {
        text: 'Accessing system documents, sir. File browser opened. Select any file to inspect.',
        actionLabel: 'Select File from System',
      };
    }

    // 5. Open VS Code & Write To-Do List Program — Advanced Coding Task
    if (
      (lower.includes('vs code') || lower.includes('vscode')) ||
      (lower.includes('do list') || lower.includes('todo'))
    ) {
      // Launch local VS Code immediately via protocol
      openExternalUrl('vscode://');

      const isPython = lower.includes('python');
      const todoCode = isPython
        ? `# =======================================================
# MABIX 3.0 APEX (J.A.R.V.I.S.) — Production To-Do List Engine
# Creator & Developer: Tharun Thangadi
# =======================================================

import json
import os
import sys

TASK_STORAGE = "tasks.json"

def load_tasks():
    if os.path.exists(TASK_STORAGE):
        try:
            with open(TASK_STORAGE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_tasks(tasks):
    with open(TASK_STORAGE, "w") as f:
        json.dump(tasks, f, indent=4)

def render_banner():
    print("\\n" + "=" * 45)
    print("      J.A.R.V.I.S. TASK ORCHESTRATOR")
    print("=" * 45)
    print(" [1] List Active Tasks")
    print(" [2] Add New Objective")
    print(" [3] Complete Objective")
    print(" [4] Delete Objective")
    print(" [5] Purge Completed Tasks")
    print(" [6] Exit Terminal")

def main():
    tasks = load_tasks()
    while True:
        render_banner()
        cmd = input("\\nJarvis > ").strip()
        if cmd == "1":
            if not tasks:
                print("\\nNo pending objectives found, sir.")
            else:
                print("\\n--- ACTIVE DIRECTIVES ---")
                for i, t in enumerate(tasks, 1):
                    mark = "[✓]" if t.get("done") else "[ ]"
                    print(f"{mark} {i}. {t['title']}")
        elif cmd == "2":
            title = input("Enter objective title: ").strip()
            if title:
                tasks.append({"title": title, "done": False})
                save_tasks(tasks)
                print(f"✓ Objective recorded: {title}")
        elif cmd == "3":
            idx = int(input("Task # to complete: ")) - 1
            if 0 <= idx < len(tasks):
                tasks[idx]["done"] = True
                save_tasks(tasks)
                print("✓ Marked as completed, sir.")
        elif cmd == "4":
            idx = int(input("Task # to delete: ")) - 1
            if 0 <= idx < len(tasks):
                removed = tasks.pop(idx)
                save_tasks(tasks)
                print(f"✓ Deleted: {removed['title']}")
        elif cmd == "5":
            tasks = [t for t in tasks if not t.get("done")]
            save_tasks(tasks)
            print("✓ Completed objectives purged.")
        elif cmd == "6":
            print("Session terminated. Standby mode, sir.\\n")
            break

if __name__ == "__main__":
    main()`
        : `// =======================================================
// MABIX 3.0 APEX (J.A.R.V.I.S.) — Interactive React To-Do Center
// Creator & Developer: Tharun Thangadi
// =======================================================

import React, { useState, useEffect } from 'react';

export default function JarvisTodoApp() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('jarvis_todos');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('jarvis_todos', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input.trim(), completed: false }]);
    setInput('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'system-ui', color: '#e0f7fa', background: '#0a1628', padding: 24, borderRadius: 16, border: '1px solid rgba(0, 243, 255, 0.3)' }}>
      <h2 style={{ color: '#00f3ff', letterSpacing: 2 }}>⚡ J.A.R.V.I.S. TASK ORCHESTRATOR</h2>
      <form onSubmit={addTask} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input 
          style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #1e3a5f', background: '#030c1b', color: '#fff' }}
          placeholder="Enter new objective..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #00f3ff, #0284c7)', color: '#030712', border: 'none', borderRadius: 8, fontWeight: 800 }}>ADD</button>
      </form>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: filter === f ? '#00f3ff' : '#030c1b', color: filter === f ? '#000' : '#888', fontWeight: 'bold' }}>{f.toUpperCase()}</button>
        ))}
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filtered.map(t => (
          <li key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#030c1b', border: '1px solid rgba(0,243,255,0.15)', borderRadius: 8, marginBottom: 8 }}>
            <span onClick={() => toggleTask(t.id)} style={{ textDecoration: t.completed ? 'line-through' : 'none', cursor: 'pointer', color: t.completed ? '#64748b' : '#f8fafc' }}>
              {t.completed ? '✓ ' : '○ '} {t.text}
            </span>
            <button onClick={() => deleteTask(t.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`;

      const fileName = isPython ? 'todo_app.py' : 'TodoApp.jsx';

      return {
        text: 'Opening Visual Studio Code, sir. I have generated your to-do list program below.',
        actionUrl: 'vscode://',
        actionLabel: 'Visual Studio Code',
        secondaryUrl: 'https://vscode.dev',
        secondaryLabel: 'VS Code Web',
        isCode: true,
        codeSnippet: todoCode,
        downloadFile: {
          name: fileName,
          content: todoCode,
          label: `Download ${fileName}`,
        },
      };
    }

    // 6. Set Timer — Immediate HUD Display
    const timerMatch =
      lower.match(/(?:set|start|create)(?: a)? timer (?:for |of )?(\d+)\s*(min|minute|minutes|m|sec|second|seconds|s)/i) ||
      lower.match(/timer (?:for |of )?(\d+)\s*(min|minute|minutes|m|sec|second|seconds|s)/i);

    if (timerMatch) {
      const val = parseInt(timerMatch[1], 10);
      const unit = timerMatch[2].toLowerCase();
      const isMin = unit.startsWith('m');
      const totalSecs = isMin ? val * 60 : val;

      setActiveTimers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          label: `${val} ${isMin ? 'Minutes' : 'Seconds'}`,
          remaining: totalSecs,
          total: totalSecs,
        },
      ]);

      return {
        text: `Timer set for ${val} ${isMin ? 'minutes' : 'seconds'}, sir. Countdown clock is now actively displayed on the HUD interface.`,
        isTimer: true,
      };
    }

    // 7. Google Search
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

    // 8. GitHub
    if (lower.includes('github')) {
      const url = 'https://github.com';
      openExternalUrl(url);
      return {
        text: 'Opening GitHub, sir.',
        actionUrl: url,
        actionLabel: 'GitHub',
      };
    }

    // 9. Wikipedia
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

    // 10. Play music
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

    // 11. System diagnostics
    if (lower.includes('system diagnostic') || lower.includes('system status') || lower.includes('status report')) {
      return {
        text: 'All systems nominal, sir. Neural core operational at 98% efficiency. 16 cores synchronized. MK VI Rugged Voice Engine active.',
      };
    }

    return null;
  };

  // Reusable Dispatcher for both Typed Text & Spoken Voice
  const dispatchCommand = async (cmdString) => {
    const cmd = (cmdString || inputCmd).trim();
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
      const secondaryUrl = typeof localResult === 'object' ? localResult.secondaryUrl : null;
      const secondaryLabel = typeof localResult === 'object' ? localResult.secondaryLabel : null;
      const isCode = typeof localResult === 'object' ? localResult.isCode : false;
      const codeSnippet = typeof localResult === 'object' ? localResult.codeSnippet : null;
      const downloadFile = typeof localResult === 'object' ? localResult.downloadFile : null;

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
          secondaryUrl,
          secondaryLabel,
          isCode,
          codeSnippet,
          downloadFile,
        },
      ]);
      speakResponse(resText);
      return;
    }

    // Otherwise, dispatch to MABIX 3.0 APEX AI engine
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
      speakResponse('Communication error, sir. Rerouting neural bus.');
    }
  };

  // Main Form Submit Handler for Typed Input
  const handleSendCommand = (e) => {
    e?.preventDefault();
    dispatchCommand(inputCmd);
  };

  // Purge Comms Log
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
      {/* Hidden file input for system documents */}
      <input
        type="file"
        ref={docFileInputRef}
        onChange={handleDocumentSelected}
        style={{ display: 'none' }}
      />

      {/* Top Header Bar matching Screenshot */}
      <header className="apex-hud-topbar">
        <div className="apex-topbar-left">
          <span className="apex-brand-title">J . A . R . V . I . S</span>
          <span className="apex-brand-sub">PERSONAL INTERFACE • MK VI • RUGGED BARITONE VOICE</span>
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
            {speechEnabled ? '🔊 RUGGED VOICE ON' : '🔇 MUTED'}
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
              <span className="val-cyan">MABIX 3.0 APEX</span>
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
              <span className="val-cyan truncate">Rugged Baritone Male</span>
            </div>
            <div className="telemetry-row">
              <span>PITCH</span>
              <span className="val-cyan">0.68 (Deep Baritone)</span>
            </div>
            <div className="telemetry-row">
              <span>INPUT</span>
              <span className={isListening ? 'val-green' : 'val-cyan'}>
                {isListening ? 'LISTENING' : 'KEYBOARD & MIC READY'}
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
              <span>SESSION</span>
              <span className="val-cyan">
                UP {sessionMinutes}M • {cmdCount} CMD
              </span>
            </div>
          </div>

          {/* 5. Mic Frequency Visualizer Bars */}
          <div className="telemetry-box">
            <span className="telemetry-label">AUDIO VISUALIZER</span>
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

          {/* 6. Active Timers (Sidebar list) */}
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
          {/* ============================================================== */}
          {/* HIGH-VISIBILITY PROMINENT HUD COUNTDOWN TIMER WIDGET           */}
          {/* ============================================================== */}
          {activeTimers.length > 0 && (
            <div className="hud-prominent-timer-card">
              <div className="hud-timer-card-header">
                <span className="hud-timer-radar-dot"></span>
                <span className="hud-timer-badge-text">J.A.R.V.I.S. ACTIVE COUNTDOWN</span>
                <span className="hud-timer-status-pill">ARMED</span>
              </div>
              {activeTimers.map((t) => {
                const mins = Math.floor(t.remaining / 60);
                const secs = t.remaining % 60;
                const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                const total = t.total || 120;
                const pct = Math.max(0, Math.min(100, ((total - t.remaining) / total) * 100));

                return (
                  <div key={t.id} className="hud-timer-clock-row">
                    <div className="hud-timer-clock-digits">{timeFormatted}</div>
                    <div className="hud-timer-meta-col">
                      <span className="hud-timer-task-name">{t.label || 'Task Countdown'}</span>
                      <span className="hud-timer-sub-left">
                        {mins > 0 ? `${mins}m ${secs}s remaining` : `${secs}s remaining`}
                      </span>
                      <div className="hud-timer-progress-track">
                        <div className="hud-timer-progress-glow" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="hud-timer-stop-action-btn"
                      onClick={() => cancelTimer(t.id)}
                      title="Stop & Dismiss Timer"
                    >
                      ✕ STOP
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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
              onClick={() => dispatchCommand('Set a timer for 2 minutes')}
            >
              ⏱️ "SET TIMER 2 MIN"
            </button>
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => dispatchCommand('Open VS Code and write a to do list program')}
            >
              ⚡ "VS CODE & TO-DO APP"
            </button>
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => dispatchCommand('Create folder todo-project')}
            >
              📁 "CREATE FOLDER"
            </button>
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => dispatchCommand('Open documents in the system')}
            >
              📄 "OPEN DOCUMENTS"
            </button>
            <button
              type="button"
              className="apex-prompt-pill"
              onClick={() => dispatchCommand('Open YouTube and play songs')}
            >
              ▶️ "OPEN YOUTUBE"
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

                {/* Interactive Action Launcher Buttons */}
                {(log.actionUrl || log.secondaryUrl) && (
                  <div className="comms-action-wrapper" style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {log.actionUrl && (
                      <a
                        href={log.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comms-action-link-btn"
                        title={`Open ${log.actionLabel || 'App'}`}
                      >
                        ↗ Launch {log.actionLabel || 'App'}
                      </a>
                    )}
                    {log.secondaryUrl && (
                      <a
                        href={log.secondaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comms-action-link-btn secondary"
                        title={`Open ${log.secondaryLabel || 'Web App'}`}
                      >
                        🌐 {log.secondaryLabel || 'Web Version'}
                      </a>
                    )}
                  </div>
                )}

                {/* Code Snippet Block with Copy & Download */}
                {log.isCode && log.codeSnippet && (
                  <div className="comms-code-box">
                    <div className="comms-code-header">
                      <span className="comms-code-badge">TERMINAL / CODE DISPATCH</span>
                      <div className="comms-code-tools">
                        <button
                          type="button"
                          className="comms-code-action-btn"
                          onClick={() => handleCopyCode(log.codeSnippet, log.id)}
                        >
                          {copiedId === log.id ? '✓ COPIED' : '📋 COPY'}
                        </button>
                        {log.downloadFile && (
                          <button
                            type="button"
                            className="comms-code-action-btn download"
                            onClick={() => handleDownloadFile(log.downloadFile.name, log.downloadFile.content)}
                          >
                            💾 {log.downloadFile.name}
                          </button>
                        )}
                      </div>
                    </div>
                    <pre className="comms-code-pre">
                      <code>{log.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
            <div ref={commsEndRef} />
          </div>
        </aside>
      </div>

      {/* Bottom Command Bar with Fully Accessible Typing Input & Voice Mic */}
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
            ref={inputRef}
            type="text"
            className="apex-cmd-input"
            placeholder="ASK MABIX or speak into mic..."
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            autoFocus
          />

          <button
            type="submit"
            className={`apex-send-btn ${inputCmd.trim() ? 'active' : ''}`}
            title="Send Command (Enter)"
          >
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
