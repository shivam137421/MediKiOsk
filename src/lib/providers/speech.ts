'use client';

export interface SpeechProviderState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  isSupported: boolean;
}

export class BrowserSpeechService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
      this.synthesis = window.speechSynthesis || null;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(this.recognition || this.synthesis);
  }

  public startListening(
    language: 'en' | 'hi',
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech Recognition not supported in this browser.');
      return false;
    }

    try {
      this.recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const text = finalTranscript || interimTranscript;
        onResult(text, Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn('Speech recognition start error:', e);
      onError(e);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      this.isListening = false;
    }
  }

  public speak(text: string, language: 'en' | 'hi', onEnd?: () => void): void {
    if (!this.synthesis) return;

    this.synthesis.cancel(); // Cancel any prior speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clinical clarity
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

export const speechService = new BrowserSpeechService();
