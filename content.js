let autoModeEnabled = false;
let currentLang = 'ja';

const translations = {
  ja: { chars: '文字数', nospace: '空白なし', lines: '行数', words: '単語数' },
  en: { chars: 'Chars', nospace: 'No Space', lines: 'Lines', words: 'Words' }
};

// Sync state
chrome.storage.local.get(['autoMode', 'language'], (result) => {
  autoModeEnabled = result.autoMode || false;
  currentLang = result.language || 'ja';
  console.log('WordCounter: Initialized. Auto:', autoModeEnabled, 'Lang:', currentLang);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoMode) {
    autoModeEnabled = changes.autoMode.newValue;
    console.log('WordCounter: Auto Mode changed to:', autoModeEnabled);
  }
  if (changes.language) {
    currentLang = changes.language.newValue;
    if (tooltip) {
      updateTooltipLabels();
    }
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
      padding: 16px 20px;
      border-radius: 16px;
      font-size: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      border: 2px solid #fff;
      display: flex;
      flex-direction: column;
      gap: 10px;
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
      gap: 24px;
    }
    .label {
      color: #777;
      font-size: 11px;
      font-weight: 700;
    }
    .value {
      font-weight: 800;
      color: #555;
      font-size: 1.1em;
    }
    .row.primary {
      padding-bottom: 6px;
      border-bottom: 1px solid #ddd;
      margin-bottom: 4px;
    }
    .row.primary .label {
       font-size: 12px;
       color: #ff6b6b;
    }
    .row.primary .value {
       font-size: 1.6em;
       font-weight: 900;
       color: #ff6b6b;
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'wc-tooltip';
  container.innerHTML = `
    <div class="row primary">
      <span class="label" id="lbl-chars"></span>
      <span class="value" id="val-chars">0</span>
    </div>
    <div class="row">
      <span class="label" id="lbl-nospace"></span>
      <span class="value" id="val-nospace">0</span>
    </div>
    <div class="row">
      <span class="label" id="lbl-lines"></span>
      <span class="value" id="val-lines">0</span>
    </div>
    <div class="row">
      <span class="label" id="lbl-words"></span>
      <span class="value" id="val-words">0</span>
    </div>
  `;
  shadow.appendChild(container);

  document.body.appendChild(host);

  // Set initial labels
  updateTooltipLabels(container);

  return { host, container, shadow };
}

function updateTooltipLabels(containerEl) {
  const t = translations[currentLang];
  const target = containerEl || (tooltip ? tooltip.container : null);
  if (!target) return;

  target.querySelector('#lbl-chars').textContent = t.chars;
  target.querySelector('#lbl-nospace').textContent = t.nospace;
  target.querySelector('#lbl-lines').textContent = t.lines;
  target.querySelector('#lbl-words').textContent = t.words;
}

function updateTooltipPosition(rect) {
  if (!tooltip) tooltip = createTooltip();

  updateTooltipLabels();

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
      const lines = text ? text.split(/\n/).length : 0;

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
      const linesEl = tooltip.shadow.getElementById('val-lines');
      const wordsEl = tooltip.shadow.getElementById('val-words');

      charEl.textContent = chars;
      noSpaceEl.textContent = noSpace;
      linesEl.textContent = lines;
      wordsEl.textContent = words;

      updateTooltipPosition(rect);
    }
  } else {
    hideTooltip();
  }
});

document.addEventListener('mousedown', (e) => {
  hideTooltip();
});
