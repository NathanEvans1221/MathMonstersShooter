export class TTSManager {
    static enabled = true;

    static setEnabled(val) {
        this.enabled = val;
        if (!val) window.speechSynthesis.cancel();
    }

    static speak(text, locale) {
        if (!this.enabled || !window.speechSynthesis) return;

        // Cancel previous speech to prevent overlapping
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Map locale 'zh' to 'zh-TW', 'en' to 'en-US'
        utterance.lang = locale === 'zh' ? 'zh-TW' : 'en-US';

        // Adjust properties for better clarity for kids
        utterance.rate = 0.9; // Slightly slower
        utterance.pitch = 1.1; // Slightly higher pitch (friendly)

        window.speechSynthesis.speak(utterance);
    }
}
