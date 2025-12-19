document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        input: document.getElementById('input-text'),
        charCount: document.getElementById('count-chars'),
        noSpaceCount: document.getElementById('count-no-space'),
        lineCount: document.getElementById('count-lines'),
        wordCount: document.getElementById('count-words'),
        autoModeToggle: document.getElementById('autoModeToggle')
    };

    // Load Auto Mode setting
    chrome.storage.local.get(['autoMode'], (result) => {
        elements.autoModeToggle.checked = result.autoMode || false;
    });

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
