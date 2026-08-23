'use client';

import React from 'react';
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onToggleMic: () => void;
  onReplayAudioPrompt: () => void;
  language: 'en' | 'hi';
}

export function VoiceVisualizer({
  isListening,
  isSpeaking,
  transcript,
  onToggleMic,
  onReplayAudioPrompt,
  language,
}: VoiceVisualizerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
      
      {/* Background glowing aura when active */}
      {isListening && (
        <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
      )}
      {isSpeaking && (
        <div className="absolute inset-0 bg-sky-500/10 animate-pulse pointer-events-none" />
      )}

      {/* Center Soundwave or Mic Button */}
      <div className="flex items-center gap-6 mb-4">
        
        {/* Replay Audio Prompt Button */}
        <button
          onClick={onReplayAudioPrompt}
          title="Replay Audio Question"
          className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-md"
        >
          <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-sky-400 animate-bounce' : ''}`} />
        </button>

        {/* Big Touch Microphone Action Button */}
        <button
          onClick={onToggleMic}
          className={`relative p-5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 kiosk-touch-target flex items-center justify-center ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50'
              : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30'
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {/* Dynamic Soundwaves */}
        <div className="flex items-center h-10 px-3">
          <span className={`soundwave-bar ${isListening ? 'bg-rose-400' : isSpeaking ? 'bg-sky-400' : 'bg-slate-700 opacity-40'}`} />
          <span className={`soundwave-bar ${isListening ? 'bg-rose-400' : isSpeaking ? 'bg-sky-400' : 'bg-slate-700 opacity-40'}`} />
          <span className={`soundwave-bar ${isListening ? 'bg-rose-400' : isSpeaking ? 'bg-sky-400' : 'bg-slate-700 opacity-40'}`} />
          <span className={`soundwave-bar ${isListening ? 'bg-rose-400' : isSpeaking ? 'bg-sky-400' : 'bg-slate-700 opacity-40'}`} />
          <span className={`soundwave-bar ${isListening ? 'bg-rose-400' : isSpeaking ? 'bg-sky-400' : 'bg-slate-700 opacity-40'}`} />
        </div>

      </div>

      {/* Visual State Tag */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : isSpeaking ? 'bg-sky-400 animate-ping' : 'bg-emerald-400'}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {isListening
            ? language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'
            : isSpeaking
            ? language === 'hi' ? 'प्रश्न बोला जा रहा है...' : 'Speaking prompt...'
            : language === 'hi' ? 'माइक दबाकर बोलें या नीचे विकल्प चुनें' : 'Tap mic to speak or select touch options below'}
        </p>
      </div>

      {/* Live Voice Transcript Output */}
      {transcript && (
        <div className="mt-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700 max-w-md w-full text-center">
          <p className="text-xs text-slate-400 mb-0.5 font-medium">Understood transcript:</p>
          <p className="text-sm font-semibold text-emerald-400 italic">
            &quot;{transcript}&quot;
          </p>
        </div>
      )}

    </div>
  );
}
