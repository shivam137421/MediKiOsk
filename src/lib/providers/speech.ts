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

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis || null;
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
        // Ignore "no-speech" or "aborted" harmless events
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        console.log('[BrowserSpeechService] Speech recognition session ended.');
        if (onStatusChange) onStatusChange(false);
        this.currentRecognition = null;

        // If user finished speaking and we have a captured transcript, submit it
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

  public speak(text: string, language: 'en' | 'hi', onEnd?: () => void): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop any overlapping speech

      // Clean markdown symbols from spoken text
      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95; // Clear clinical pace
      utterance.pitch = 1.0;

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[BrowserSpeechService] TTS speak error:', e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new BrowserSpeechService();
