'use client';

import { useState, useRef, useEffect } from 'react';

const PRESET_PLACES = [
  {
    id: 'transparent',
    name: 'Transparent',
    icon: '✂️',
    description: 'Clean PNG Cutout',
    type: 'transparent',
  },
  {
    id: 'beach',
    name: 'Tropical Beach',
    icon: '🏖️',
    description: 'Turquoise ocean & golden sand',
    type: 'gradient',
    css: 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 45%, #fde047 75%, #ca8a04 100%)',
  },
  {
    id: 'paris',
    name: 'Paris Sunset',
    icon: '🗼',
    description: 'Romantic Parisian skyline',
    type: 'gradient',
    css: 'linear-gradient(135deg, #4c1d95 0%, #be185d 50%, #f59e0b 100%)',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk City',
    icon: '🏙️',
    description: 'Futuristic neon skyscrapers',
    type: 'gradient',
    css: 'radial-gradient(circle at 50% 30%, #3b82f6 0%, #1e1b4b 60%, #09090b 100%)',
  },
  {
    id: 'alps',
    name: 'Swiss Alps',
    icon: '🏔️',
    description: 'Majestic snowy mountain ridge',
    type: 'gradient',
    css: 'linear-gradient(180deg, #0284c7 0%, #bae6fd 60%, #f1f5f9 100%)',
  },
  {
    id: 'space',
    name: 'Deep Space',
    icon: '🚀',
    description: 'Cosmic nebula & starlight',
    type: 'gradient',
    css: 'radial-gradient(circle at 30% 40%, #7c3aed 0%, #0f172a 70%, #020617 100%)',
  },
  {
    id: 'studio',
    name: 'Luxury Studio',
    icon: '🏛️',
    description: 'Minimalist high-end backdrop',
    type: 'gradient',
    css: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  {
    id: 'forest',
    name: 'Bamboo Forest',
    icon: '🌿',
    description: 'Lush tranquil greenery',
    type: 'gradient',
    css: 'linear-gradient(180deg, #15803d 0%, #166534 60%, #14532d 100%)',
  },
];

const FILTERS = [
  { id: 'none', name: 'Original', filterStr: 'none' },
  { id: 'vivid', name: 'Vivid HDR', filterStr: 'contrast(125%) saturate(140%)' },
  { id: 'cyber', name: 'Cyber Glow', filterStr: 'hue-rotate(290deg) saturate(160%)' },
  { id: 'warm', name: 'Warm Sunset', filterStr: 'sepia(30%) saturate(130%) brightness(105%)' },
  { id: 'noir', name: 'Noir B&W', filterStr: 'grayscale(100%) contrast(140%)' },
  { id: 'vintage', name: 'Vintage', filterStr: 'sepia(50%) contrast(90%) brightness(95%)' },
];

export default function PhotoEditorModal({ isOpen, onClose, onInsertToChat, initialImage = null }) {
  const [sourceImage, setSourceImage] = useState(initialImage);
  const [selectedPlace, setSelectedPlace] = useState(PRESET_PLACES[0]);
  const [removeBgActive, setRemoveBgActive] = useState(false);
  const [bgThreshold, setBgThreshold] = useState(45);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const customBgInputRef = useRef(null);
  const [customBgImage, setCustomBgImage] = useState(null);

  useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
    }
  }, [initialImage]);

  // Render canvas whenever controls change
  useEffect(() => {
    if (!isOpen || !sourceImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size (capped at max 1200px width/height for performance)
      const maxDim = 1000;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;

      // 1. Draw Background
      if (selectedPlace.id === 'transparent') {
        ctx.clearRect(0, 0, w, h);
      } else if (customBgImage) {
        ctx.drawImage(customBgImage, 0, 0, w, h);
      } else if (selectedPlace.css) {
        // Draw gradient background
        const grad = ctx.createLinearGradient(0, 0, w, h);
        if (selectedPlace.id === 'beach') {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(0.5, '#7dd3fc');
          grad.addColorStop(0.75, '#fde047');
          grad.addColorStop(1, '#ca8a04');
        } else if (selectedPlace.id === 'paris') {
          grad.addColorStop(0, '#4c1d95');
          grad.addColorStop(0.5, '#be185d');
          grad.addColorStop(1, '#f59e0b');
        } else if (selectedPlace.id === 'cyberpunk') {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(0.5, '#7c3aed');
          grad.addColorStop(1, '#09090b');
        } else if (selectedPlace.id === 'alps') {
          grad.addColorStop(0, '#0284c7');
          grad.addColorStop(0.6, '#bae6fd');
          grad.addColorStop(1, '#ffffff');
        } else if (selectedPlace.id === 'space') {
          grad.addColorStop(0, '#7c3aed');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#020617');
        } else if (selectedPlace.id === 'studio') {
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#0f172a');
        } else if (selectedPlace.id === 'forest') {
          grad.addColorStop(0, '#15803d');
          grad.addColorStop(0.6, '#166534');
          grad.addColorStop(1, '#14532d');
        } else {
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(1, '#020617');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Prepare Foreground Image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0, w, h);

      // 3. Background Removal Algorithm (Color similarity from corner pixels)
      if (removeBgActive) {
        const imgData = tempCtx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample corner background colors (top-left, top-right, bottom-left)
        const corners = [
          [data[0], data[1], data[2]], // Top-left
          [data[(w - 1) * 4], data[(w - 1) * 4 + 1], data[(w - 1) * 4 + 2]], // Top-right
          [data[(h - 1) * w * 4], data[(h - 1) * w * 4 + 1], data[(h - 1) * w * 4 + 2]], // Bottom-left
        ];

        const threshSq = bgThreshold * bgThreshold * 3;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if pixel is close to any corner sample
          let isBg = false;
          for (const c of corners) {
            const dr = r - c[0];
            const dg = g - c[1];
            const db = b - c[2];
            const distSq = dr * dr + dg * dg + db * db;
            if (distSq < threshSq) {
              isBg = true;
              break;
            }
          }

          // Also check for common near-white or near-black backgrounds if threshold is high
          if (!isBg && bgThreshold > 40) {
            const isWhite = r > 230 && g > 230 && b > 230;
            const isBlack = r < 25 && g < 25 && b < 25;
            if (isWhite || isBlack) isBg = true;
          }

          if (isBg) {
            data[i + 3] = 0; // Alpha 0 (Transparent)
          }
        }

        tempCtx.putImageData(imgData, 0, 0);
      }

      // 4. Apply Filters & Adjustments onto foreground
      ctx.save();
      const filterParts = [];
      if (activeFilter.id !== 'none') filterParts.push(activeFilter.filterStr);
      filterParts.push(`brightness(${brightness}%)`);
      filterParts.push(`contrast(${contrast}%)`);
      filterParts.push(`saturate(${saturation}%)`);
      ctx.filter = filterParts.join(' ');

      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();
    };

    img.src = sourceImage;
  }, [
    isOpen,
    sourceImage,
    selectedPlace,
    removeBgActive,
    bgThreshold,
    activeFilter,
    brightness,
    contrast,
    saturation,
    customBgImage,
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSourceImage(ev.target.result);
      setRemoveBgActive(true); // Default to removing background on upload
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCustomBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setCustomBgImage(img);
        setSelectedPlace({ id: 'custom', name: 'Custom Upload', icon: '🖼️' });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `MABIX-Ultra-Edit-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSendToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onInsertToChat(dataUrl, `I edited this photo using MABIX 2.0 Core Ultra Imagine Studio (${selectedPlace.name}, ${activeFilter.name}). Please review and give me creative feedback!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="photo-modal-header">
          <div className="photo-modal-title-group">
            <span className="photo-modal-badge">MABIX 2.0 CORE ULTRA</span>
            <h2 className="photo-modal-title">Imagine Photo Studio</h2>
            <p className="photo-modal-subtitle">AI Background Removal &amp; Scenic Place Swap</p>
          </div>
          <button className="photo-modal-close-btn" onClick={onClose} title="Close Studio">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="photo-modal-body">
          {/* Left Canvas Preview Area */}
          <div className="photo-canvas-area">
            {sourceImage ? (
              <div className="photo-canvas-wrapper">
                <canvas ref={canvasRef} className="photo-editor-canvas" />
                {isProcessing && (
                  <div className="photo-processing-badge">
                    <span className="loading-spinner"></span>
                    <span>Processing visual elements...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="photo-dropzone" onClick={() => fileInputRef.current?.click()}>
                <span className="photo-dropzone-icon">📷</span>
                <h3>Upload a Photo to Edit</h3>
                <p>Supports PNG, JPG, WEBP. Instant Background Removal &amp; Place Replacement.</p>
                <button type="button" className="photo-upload-trigger-btn">
                  Choose Photo
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={customBgInputRef}
              onChange={handleCustomBgUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Right Control Sidebar */}
          <div className="photo-controls-sidebar">
            {/* Quick Upload / Replace Image */}
            <div className="control-group">
              <button
                type="button"
                className="control-action-btn secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                🔄 {sourceImage ? 'Change Image' : 'Select Image'}
              </button>
            </div>

            {/* 1. Background Removal Toggle */}
            <div className="control-group">
              <div className="control-header-row">
                <span className="control-label">✂️ Background Removal</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={removeBgActive}
                    onChange={(e) => setRemoveBgActive(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {removeBgActive && (
                <div className="control-slider-box">
                  <div className="slider-label-row">
                    <span>Cutout Sensitivity</span>
                    <span className="slider-val">{bgThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={bgThreshold}
                    onChange={(e) => setBgThreshold(Number(e.target.value))}
                    className="photo-slider"
                  />
                </div>
              )}
            </div>

            {/* 2. Choose Different Places */}
            <div className="control-group">
              <span className="control-label">🏞️ Add Different Places</span>
              <div className="places-grid">
                {PRESET_PLACES.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className={`place-chip ${selectedPlace.id === place.id ? 'active' : ''}`}
                    onClick={() => {
                      setCustomBgImage(null);
                      setSelectedPlace(place);
                    }}
                  >
                    <span className="place-icon">{place.icon}</span>
                    <span className="place-name">{place.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`place-chip custom ${selectedPlace.id === 'custom' ? 'active' : ''}`}
                  onClick={() => customBgInputRef.current?.click()}
                  title="Upload custom background image"
                >
                  <span className="place-icon">🖼️</span>
                  <span className="place-name">Custom BG</span>
                </button>
              </div>
            </div>

            {/* 3. Artistic Filters */}
            <div className="control-group">
              <span className="control-label">🎨 Aesthetic Filters</span>
              <div className="filters-row">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-btn ${activeFilter.id === f.id ? 'active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Fine Enhancements */}
            <div className="control-group">
              <span className="control-label">✨ Color Enhancements</span>
              <div className="control-slider-box">
                <div className="slider-label-row">
                  <span>Brightness</span>
                  <span className="slider-val">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="photo-slider"
                />
              </div>

              <div className="control-slider-box">
                <div className="slider-label-row">
                  <span>Contrast</span>
                  <span className="slider-val">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="photo-slider"
                />
              </div>

              <div className="control-slider-box">
                <div className="slider-label-row">
                  <span>Saturation</span>
                  <span className="slider-val">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="photo-slider"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="photo-actions-row">
              <button
                type="button"
                className="control-action-btn primary"
                disabled={!sourceImage}
                onClick={handleDownload}
              >
                💾 Download PNG
              </button>
              <button
                type="button"
                className="control-action-btn ultra"
                disabled={!sourceImage}
                onClick={handleSendToChat}
              >
                💬 Send to MABIX
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
