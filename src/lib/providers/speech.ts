'use client';

export interface SpeechProviderState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  isSupported: boolean;
}

export class BrowserSpeechService {
  private currentRecognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private activeTranscript: string = '';
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis || null;
      if (this.synthesis) {
        this.loadVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const hasRecognition = Boolean(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
    return hasRecognition || Boolean(window.speechSynthesis);
  }

  /**
   * Finds the best native Indian voice for Hindi (hi-IN) or Indian English (en-IN).
   */
  private getBestIndianVoice(language: 'en' | 'hi'): SpeechSynthesisVoice | null {
    this.loadVoices();
    const voices = this.cachedVoices;
    if (!voices || voices.length === 0) return null;

    if (language === 'hi') {
      // 1. Hindi Natural Voices (Microsoft Edge / Chrome / Android)
      const hindiPriorityNames = [
        'swara',
        'hemant',
        'kalpana',
        'google हिन्दी',
        'google hindi',
        'hindi',
        'हिन्दी',
      ];
      for (const name of hindiPriorityNames) {
        const found = voices.find(v => 
          v.name.toLowerCase().includes(name) || (v.lang && (v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase().startsWith('hi')))
        );
        if (found) return found;
      }
      return voices.find(v => v.lang.toLowerCase().startsWith('hi')) || null;
    } else {
      // 2. Indian English Natural Voices (Microsoft Neerja / Prabhat / Google Indian English)
      const indianEnglishPriorityNames = [
        'neerja',
        'prabhat',
        'heera',
        'ravi',
        'google indian english',
        'india',
        'en-in',
        'en_in',
      ];
      for (const name of indianEnglishPriorityNames) {
        const found = voices.find(v => 
          v.name.toLowerCase().includes(name) || (v.lang && (v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in'))
        );
        if (found) return found;
      }
      return voices.find(v => v.lang.toLowerCase().includes('in')) || null;
    }
  }

  public startListening(
    language: 'en' | 'hi',
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onStatusChange?: (isListening: boolean) => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech Recognition is not supported in this browser. Please use Chrome, Edge, or type your message.';
      console.warn('[BrowserSpeechService]', msg);
      onError(msg);
      return false;
    }

    // Always stop any prior instance cleanly before creating a fresh one
    this.stopListening();
    this.activeTranscript = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false; // Capture discrete sentence per turn
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('[BrowserSpeechService] Speech recognition session started. Lang:', recognition.lang);
        if (onStatusChange) onStatusChange(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            if (item.isFinal) {
              finalText += item[0].transcript;
            } else {
              interimText += item[0].transcript;
            }
          }
        }

        const combined = (finalText || interimText).trim();
        if (combined) {
          this.activeTranscript = combined;
          console.log('[BrowserSpeechService] Heard:', combined, 'isFinal:', Boolean(finalText));
          onResult(combined, Boolean(finalText));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[BrowserSpeechService] Speech recognition event error:', event.error);
        if (onStatusChange) onStatusChange(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        console.log('[BrowserSpeechService] Speech recognition session ended.');
        if (onStatusChange) onStatusChange(false);
        this.currentRecognition = null;

        if (this.activeTranscript && this.activeTranscript.trim().length > 0) {
          onResult(this.activeTranscript.trim(), true);
          this.activeTranscript = '';
        }
      };

      this.currentRecognition = recognition;
      recognition.start();
      return true;
    } catch (e: any) {
      console.error('[BrowserSpeechService] Error initializing recognition:', e);
      if (onStatusChange) onStatusChange(false);
      onError(e?.message || e);
      return false;
    }
  }

  public stopListening(): void {
    if (this.currentRecognition) {
      try {
        this.currentRecognition.stop();
      } catch (e) {
        console.warn('[BrowserSpeechService] Error stopping recognition:', e);
      }
      this.currentRecognition = null;
    }
  }

  /**
   * Speaks the text with a natural Indian accent in Hindi (hi-IN) or Indian English (en-IN).
   */
  public speak(text: string, language: 'en' | 'hi', onEnd?: () => void): void {
    if (typeof window === 'undefined') return;

    this.stopSpeaking();

    // Clean markdown and symbols for pristine speech
    const cleanText = text
      .replace(/[*_#`~|]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/[-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const indianVoice = this.getBestIndianVoice(language);

    // Method A: Browser Web Speech API with explicitly selected Indian voice
    if (window.speechSynthesis && (indianVoice || language === 'hi' || language === 'en')) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        
        if (indianVoice) {
          utterance.voice = indianVoice;
          console.log(`[BrowserSpeechService] Selected Indian Voice: "${indianVoice.name}" (${indianVoice.lang})`);
        }

        // Pacing for authentic Indian clinical clarity
        utterance.rate = language === 'hi' ? 0.92 : 0.94;
        utterance.pitch = language === 'hi' ? 1.0 : 1.05;

        let endCalled = false;
        const handleEnd = () => {
          if (!endCalled) {
            endCalled = true;
            if (onEnd) onEnd();
          }
        };

        utterance.onend = handleEnd;
        utterance.onerror = (e) => {
          console.warn('[BrowserSpeechService] Utterance error, finishing turn:', e);
          handleEnd();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (speechErr) {
        console.warn('[BrowserSpeechService] Web Speech error, trying audio fallback:', speechErr);
      }
    }

    // Method B: High-Fidelity Indian Neural Audio Stream Fallback
    try {
      const langCode = language === 'hi' ? 'hi' : 'en-IN';
      const encoded = encodeURIComponent(cleanText.slice(0, 200));
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encoded}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.play().catch(() => {
        if (onEnd) onEnd();
      });
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch {
          // Ignore
        }
        this.currentAudio = null;
      }
    }
  }
}

export const speechService = new BrowserSpeechService();
