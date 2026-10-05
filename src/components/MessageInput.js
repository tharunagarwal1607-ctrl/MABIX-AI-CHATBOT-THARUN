'use client';

import { useState, useRef, useEffect } from 'react';

export default function MessageInput({
  onSend,
  isLoading,
  onOpenImagineWithImage = null,
  activeModel = 'mabix-1.0',
}) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInput((prev) => {
              const base = prev.trim();
              return base ? `${base} ${currentTranscript.trim()}` : currentTranscript.trim();
            });
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Voice dictation is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
        setIsListening(false);
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const processFile = async (file) => {
    const isImage = file.type.startsWith('image/');
    const fileName = file.name;
    const fileSize = file.size;

    // 1. Process Image
    if (isImage) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name: fileName,
            size: fileSize,
            type: file.type,
            isImage: true,
            dataUrl: e.target.result,
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // 2. Process Plain Text / CSV / Code
    const textExtensions = [
      '.txt', '.csv', '.json', '.md', '.py', '.js', '.jsx', '.ts', '.tsx',
      '.html', '.css', '.xml', '.sql', '.log'
    ];
    const isTextFile =
      textExtensions.some((ext) => fileName.toLowerCase().endsWith(ext)) ||
      file.type.startsWith('text/');

    if (isTextFile) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name: fileName,
            size: fileSize,
            type: file.type || 'text/plain',
            isImage: false,
            textContent: e.target.result,
          });
        };
        reader.readAsText(file);
      });
    }

    // 3. Process PDF & DOCX via server-side /api/parse-file
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.text) {
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: fileName,
          size: fileSize,
          type: file.type || (fileName.endsWith('.pdf') ? 'application/pdf' : 'application/docx'),
          isImage: false,
          textContent: data.text,
        };
      } else {
        alert(data.error || `Could not parse text from ${fileName}.`);
        return null;
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert(`Failed to parse ${fileName}.`);
      return null;
    }
  };

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessingFiles(true);

    const newAttachments = [];
    for (const file of Array.from(fileList)) {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 25MB limit.`);
        continue;
      }
      const item = await processFile(file);
      if (item) newAttachments.push(item);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsProcessingFiles(false);
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSend = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isLoading || isProcessingFiles) return;

    onSend(
      trimmed ||
        (attachments.some((a) => a.isImage)
          ? 'Please analyze this attached image in detail.'
          : 'Please analyze the attached document.'),
      attachments
    );
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📑';
      case 'csv':
      case 'xlsx': return '📊';
      case 'txt': return '📝';
      case 'json':
      case 'js':
      case 'py':
      case 'html':
      case 'css': return '💻';
      default: return '📎';
    }
  };

  const canSend =
    (input.trim().length > 0 || attachments.length > 0) &&
    !isLoading &&
    !isProcessingFiles;

  const isUltra = activeModel === 'mabix-2.0-ultra';

  return (
    <div
      className={`input-area ${isDragging ? 'drag-over' : ''} ${isUltra ? 'ultra-theme' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.md,.py,.js,.jsx,.ts,.tsx,.html,.css,.xml,.sql,.log"
        style={{ display: 'none' }}
      />

      <div className="input-container">
        {/* Attachments Preview Shelf */}
        {attachments.length > 0 && (
          <div className="attachments-shelf">
            {attachments.map((att) => (
              <div key={att.id} className="attachment-chip">
                {att.isImage ? (
                  <div className="attachment-thumb-wrapper">
                    <img src={att.dataUrl} alt={att.name} className="attachment-thumb" />
                  </div>
                ) : (
                  <span className="attachment-icon">{getFileIcon(att.name)}</span>
                )}
                <div className="attachment-details">
                  <span className="attachment-name" title={att.name}>
                    {att.name}
                  </span>
                  <span className="attachment-size">{formatFileSize(att.size)}</span>
                </div>

                {/* Edit in Imagine Studio shortcut for images - Only in MABIX 2.0 Core Ultra */}
                {isUltra && att.isImage && onOpenImagineWithImage && (
                  <button
                    type="button"
                    className="attachment-edit-btn"
                    onClick={() => onOpenImagineWithImage(att.dataUrl)}
                    title="Edit in Imagine Photo Studio"
                  >
                    🎨 Edit
                  </button>
                )}

                <button
                  type="button"
                  className="attachment-remove-btn"
                  onClick={() => removeAttachment(att.id)}
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {isProcessingFiles && (
          <div className="attachment-loading">
            <span className="loading-spinner"></span>
            <span>Processing and extracting file content...</span>
          </div>
        )}

        {isUltra && isListening && (
          <div className="voice-listening-banner">
            <div className="voice-pulse-ring"></div>
            <span className="voice-listening-text">🎙️ Listening... Speak naturally into your mic</span>
            <button type="button" className="voice-stop-btn" onClick={toggleListening}>
              Done
            </button>
          </div>
        )}

        <div className="input-row">
          {/* Upload Button */}
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image, PDF, DOCX, TXT, CSV, or Code"
          >
            <span className="attach-icon">📎</span>
            <span className="attach-label">Upload</span>
          </button>

          {/* Voice Microphone Button - Exclusive to MABIX 2.0 Core Ultra */}
          {isUltra && (
            <button
              type="button"
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Dictate with Microphone'}
            >
              <span className="mic-icon">{isListening ? '🔴' : '🎙️'}</span>
            </button>
          )}

          {/* Chat Text Input */}
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={isListening ? 'Listening...' : 'Ask MABIX'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            className={`send-btn ${canSend ? 'active' : ''} ${isUltra ? 'gold-btn' : ''}`}
            onClick={handleSend}
            disabled={!canSend}
            title="Send message (Enter)"
          >
            ➤
          </button>
        </div>
      </div>

      <p className="input-disclaimer">
        {isUltra
          ? 'MABIX 2.0 (core ultra) • Creative Photo Studio & Deep Multimodal Intelligence'
          : 'MABIX 1.0 (core) • Multimodal AI with Vision & Document Understanding'}
      </p>
    </div>
  );
}
