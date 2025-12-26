document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        input: document.getElementById('input-text'),
        charCount: document.getElementById('count-chars'),
        noSpaceCount: document.getElementById('count-no-space'),
        lineCount: document.getElementById('count-lines'),
        wordCount: document.getElementById('count-words'),
        autoModeToggle: document.getElementById('autoModeToggle'),
        langToggle: document.getElementById('langToggle'),
        hintText: document.getElementById('hint-text'),
        labels: {
            chars: document.querySelector('#count-chars + .stat-label'),
            nospace: document.querySelector('#count-no-space + .stat-label'),
            lines: document.querySelector('#count-lines + .stat-label'),
            words: document.querySelector('#count-words + .stat-label'),
            auto: document.getElementById('auto-mode-label')
        }
    };

    const translations = {
        ja: {
            chars: '文字数',
            nospace: '空白なし',
            lines: '行数',
            words: '単語数',
            hint: '※ページ再読み込みが必要な場合があります',
            placeholder: 'ここにテキストを貼り付け...',
            langBtn: 'JP',
            auto: '自動'
        },
        en: {
            chars: 'Chars',
            nospace: 'No Space',
            lines: 'Lines',
            words: 'Words',
            hint: '* Page reload may be required',
            placeholder: 'Paste text here...',
            langBtn: 'EN',
            auto: 'Auto'
        }
    };

    let currentLang = 'ja';

    // Load Settings
    chrome.storage.local.get(['autoMode', 'language'], (result) => {
        elements.autoModeToggle.checked = result.autoMode || false;
        if (result.language) {
            setLanguage(result.language);
        } else {
            setLanguage('ja'); // Default
        }
    });

    // Toggle Language
    elements.langToggle.addEventListener('click', () => {
        const newLang = currentLang === 'ja' ? 'en' : 'ja';
        setLanguage(newLang);
        chrome.storage.local.set({ language: newLang });
    });

    function setLanguage(lang) {
        currentLang = lang;
        const t = translations[lang];

        // Update Latels
        elements.labels.chars.textContent = t.chars;
        elements.labels.nospace.textContent = t.nospace;
        elements.labels.lines.textContent = t.lines;
        elements.labels.words.textContent = t.words;
        if (elements.labels.auto) elements.labels.auto.textContent = t.auto;

        // Update Hint & Placeholder
        elements.hintText.textContent = t.hint;
        elements.input.placeholder = t.placeholder;

        // Update Button Text
        elements.langToggle.textContent = lang.toUpperCase();
    }

    // Toggle Auto Mode
    elements.autoModeToggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ autoMode: e.target.checked });
    });

    // Update counts
    function updateCounts() {
        const text = elements.input.value;

        // Total Characters (treating newlines as chars usually on Windows is \r\n but browser JS is \n)
        // For Japanese user expectation:
        // "Line" usually implies actual lines of text.
        // "No Space" removes spaces and tabs and newlines.

        const length = text.length; // JS length (UTF-16 code units), usually fine for general counting
        // For more precise grapheme counting we could use Intl.Segmenter but length is standard.
        // Windows notepad counts CRLF as 2 ? No, let's stick to .length which is standard web behavior.

        const noSpace = text.replace(/\s/g, '').length;
        const lines = text ? text.split(/\n/).length : 0;

        // Japanese detection (Hiragana, Katakana, Kanji)
        const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);

        let words = 0;
        if (hasJapanese) {
            words = length; // User request: same as char count for Japanese
        } else {
            words = text.trim().split(/\s+/).filter(s => s.length > 0).length;
        }

        elements.charCount.textContent = length;
        elements.noSpaceCount.textContent = noSpace;
        elements.lineCount.textContent = lines;
        elements.wordCount.textContent = words;
    }

    elements.input.addEventListener('input', updateCounts);

    // Auto-focus and paste check
    elements.input.focus();
});
