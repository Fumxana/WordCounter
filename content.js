let autoModeEnabled = false;

// Sync state
chrome.storage.local.get(['autoMode'], (result) => {
  autoModeEnabled = result.autoMode || false;
  console.log('WordCounter: Auto Mode initialized:', autoModeEnabled);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoMode) {
    autoModeEnabled = changes.autoMode.newValue;
    console.log('WordCounter: Auto Mode changed to:', autoModeEnabled);
  }
});

let tooltip = null;

function createTooltip() {
  if (tooltip) return tooltip;

  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.zIndex = '2147483647'; // Max z-index
  host.style.pointerEvents = 'none'; // Don't interfere with selection
  host.style.fontFamily = 'sans-serif';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .wc-tooltip {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      color: #333;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      border: 2px solid #fff;
      display: flex;
      flex-direction: column;
      gap: 6px;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s, transform 0.2s;
      font-family: "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
    }
    .wc-tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .label {
      color: #888;
      font-size: 10px;
      font-weight: 700;
    }
    .value {
      font-weight: 900;
      color: #ff6b6b; /* Pop red/pink */
      font-size: 1.1em;
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'wc-tooltip';
  container.innerHTML = `
    <div class="row">
      <span class="label">文字数</span>
      <span class="value" id="val-chars">0</span>
    </div>
    <div class="row">
      <span class="label">空白なし</span>
      <span class="value" id="val-nospace">0</span>
    </div>
    <div class="row">
      <span class="label">単語数</span>
      <span class="value" id="val-words">0</span>
    </div>
  `;
  shadow.appendChild(container);

  document.body.appendChild(host);

  return { host, container, shadow };
}

function updateTooltipPosition(rect) {
  if (!tooltip) tooltip = createTooltip();

  const { host, container } = tooltip;

  // Use viewport coordinates with position: fixed for robustness
  // Center horizontally over the selection
  const left = rect.left + rect.width / 2;
  const top = rect.top - 10; // 10px padding above

  host.style.position = 'fixed';
  host.style.left = left + 'px';
  host.style.top = top + 'px';
  host.style.transform = 'translate(-50%, -100%)';

  // Ensure we are not off-screen (basic check)
  // If top is negative, maybe show below?
  if (top < 50) {
    // Show below
    host.style.top = (rect.bottom + 10) + 'px';
    host.style.transform = 'translate(-50%, 0)';
  }

  // Show
  requestAnimationFrame(() => {
    container.classList.add('visible');
  });
}

function hideTooltip() {
  if (tooltip) {
    tooltip.container.classList.remove('visible');
  }
}

document.addEventListener('mouseup', () => {
  if (!autoModeEnabled) return;

  const selection = window.getSelection();
  const text = selection.toString();

  if (text.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      if (!tooltip) tooltip = createTooltip();

      const chars = text.length;
      const noSpace = text.replace(/\s/g, '').length;

      // Japanese detection
      const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
      let words = 0;
      if (hasJapanese) {
        words = chars;
      } else {
        words = text.trim().split(/\s+/).filter(s => s.length > 0).length;
      }

      const charEl = tooltip.shadow.getElementById('val-chars');
      const noSpaceEl = tooltip.shadow.getElementById('val-nospace');
      const wordsEl = tooltip.shadow.getElementById('val-words');

      charEl.textContent = chars;
      noSpaceEl.textContent = noSpace;
      wordsEl.textContent = words;

      updateTooltipPosition(rect);
    }
  } else {
    hideTooltip();
  }
});

document.addEventListener('mousedown', (e) => {
  // If clicking outside, hide
  // But mouseup handles the new selection logic.
  // We strictly need to hide if selection is cleared.
  // But mousedown starts a new selection usually.
  // Let's just rely on mouseup or selectionchange.
  // Actually, standard behavior: click clears selection usually.

  // We can just hide on mousedown to be responsive
  hideTooltip();
});
