'use client';

import { useMusicStore } from '@/store/useMusicStore';
import { useRef, useEffect } from 'react';

export function AudioPlayer() {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong, volume, setVolume } =
    useMusicStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-40 glass-panel p-3 rounded-full flex items-center gap-3 shadow-2xl border border-primary/30 max-w-sm">
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        onEnded={nextSong}
      />

      {/* Album Cover / Spinning Record */}
      <div className={`w-11 h-11 rounded-full overflow-hidden border-2 border-primary-container relative flex-shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
        <img
          src={currentSong.albumCover || '/trang_chu.png'}
          alt={currentSong.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 m-auto w-3 h-3 bg-primary rounded-full border border-white" />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-xs text-primary truncate">
          {currentSong.title}
        </p>
        <p className="font-quicksand text-[11px] text-on-surface-variant truncate font-semibold">
          {currentSong.artist}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={prevSong}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-lg">skip_previous</span>
        </button>

        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <button
          onClick={nextSong}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-lg">skip_next</span>
        </button>
      </div>
    </div>
  );
}
