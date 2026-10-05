/**
 * In-browser Image Processing Utility for MABIX 2.0 CORE ULTRA
 * Powers instant in-chat Background Removal and Scene Replacement (ChatGPT 5.5 style)
 */

export function detectImageEditIntent(prompt = '') {
  if (!prompt) return { shouldEdit: false, action: null };
  const p = prompt.toLowerCase();

  // Background Removal keywords
  const removeBgKeywords = [
    'remove background',
    'remove the background',
    'remove bg',
    'delete background',
    'cut out',
    'cutout',
    'transparent background',
    'make it transparent',
    'isolate subject',
    'erase background',
    'no background',
  ];
  if (removeBgKeywords.some((kw) => p.includes(kw))) {
    return { shouldEdit: true, action: 'remove_bg', label: 'Background Removed' };
  }

  // Scene / Place Replacement keywords
  if (p.includes('beach') || p.includes('ocean') || p.includes('tropical') || p.includes('sea')) {
    return { shouldEdit: true, action: 'beach', label: 'Placed on Tropical Beach' };
  }
  if (p.includes('paris') || p.includes('eiffel') || p.includes('france')) {
    return { shouldEdit: true, action: 'paris', label: 'Placed in Paris Sunset' };
  }
  if (p.includes('cyberpunk') || p.includes('neon') || p.includes('future') || p.includes('tokyo')) {
    return { shouldEdit: true, action: 'cyberpunk', label: 'Placed in Cyberpunk Neon City' };
  }
  if (p.includes('alps') || p.includes('mountain') || p.includes('snow') || p.includes('swiss')) {
    return { shouldEdit: true, action: 'alps', label: 'Placed on Swiss Alps' };
  }
  if (p.includes('space') || p.includes('galaxy') || p.includes('stars') || p.includes('cosmic') || p.includes('universe')) {
    return { shouldEdit: true, action: 'space', label: 'Placed in Deep Space Galaxy' };
  }
  if (p.includes('studio') || p.includes('luxury') || p.includes('penthouse') || p.includes('indoor')) {
    return { shouldEdit: true, action: 'studio', label: 'Placed in Luxury Studio' };
  }

  return { shouldEdit: false, action: null };
}

export async function processImageDirectly(imageDataUrl, action = 'remove_bg', threshold = 45) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !imageDataUrl) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
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
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw scenic background if replacing background
        if (action !== 'remove_bg') {
          const grad = ctx.createLinearGradient(0, 0, w, h);
          if (action === 'beach') {
            grad.addColorStop(0, '#38bdf8');
            grad.addColorStop(0.5, '#7dd3fc');
            grad.addColorStop(0.75, '#fde047');
            grad.addColorStop(1, '#ca8a04');
          } else if (action === 'paris') {
            grad.addColorStop(0, '#4c1d95');
            grad.addColorStop(0.5, '#be185d');
            grad.addColorStop(1, '#f59e0b');
          } else if (action === 'cyberpunk') {
            grad.addColorStop(0, '#06b6d4');
            grad.addColorStop(0.5, '#7c3aed');
            grad.addColorStop(1, '#09090b');
          } else if (action === 'alps') {
            grad.addColorStop(0, '#0284c7');
            grad.addColorStop(0.6, '#bae6fd');
            grad.addColorStop(1, '#ffffff');
          } else if (action === 'space') {
            grad.addColorStop(0, '#7c3aed');
            grad.addColorStop(0.5, '#1e1b4b');
            grad.addColorStop(1, '#020617');
          } else if (action === 'studio') {
            grad.addColorStop(0, '#334155');
            grad.addColorStop(1, '#0f172a');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }

        // Create foreground layer
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          resolve(null);
          return;
        }
        tempCtx.drawImage(img, 0, 0, w, h);

        const imgData = tempCtx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample 4 corners and borders
        const cornerSamples = [
          [data[0], data[1], data[2]],
          [data[(w - 1) * 4], data[(w - 1) * 4 + 1], data[(w - 1) * 4 + 2]],
          [data[(h - 1) * w * 4], data[(h - 1) * w * 4 + 1], data[(h - 1) * w * 4 + 2]],
          [data[((h - 1) * w + w - 1) * 4], data[((h - 1) * w + w - 1) * 4 + 1], data[((h - 1) * w + w - 1) * 4 + 2]],
        ];

        const threshSq = threshold * threshold * 3;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          let isBg = false;
          for (const c of cornerSamples) {
            const dr = r - c[0];
            const dg = g - c[1];
            const db = b - c[2];
            const distSq = dr * dr + dg * dg + db * db;
            if (distSq < threshSq) {
              isBg = true;
              break;
            }
          }

          if (!isBg && threshold > 35) {
            const isNearWhite = r > 225 && g > 225 && b > 225;
            const isNearBlack = r < 28 && g < 28 && b < 28;
            if (isNearWhite || isNearBlack) isBg = true;
          }

          if (isBg) {
            data[i + 3] = 0; // Alpha transparent
          }
        }

        tempCtx.putImageData(imgData, 0, 0);

        // Composite onto main canvas
        ctx.drawImage(tempCanvas, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('In-chat image processing error:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
}
