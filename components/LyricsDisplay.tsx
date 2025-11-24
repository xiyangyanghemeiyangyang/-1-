import React, { useRef, useState, useEffect } from 'react';
import { SongMetadata, AudioSource } from '../types';
import { Play, Pause, Disc, ArrowLeft, Download, Music } from 'lucide-react';

interface LyricsDisplayProps {
  data: SongMetadata;
  audioSource: AudioSource | null;
  onReset: () => void;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ data, audioSource, onReset }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  // Generate a random gradient based on song title length for dynamic cover art
  const coverGradient = `linear-gradient(${data.title.length * 10}deg, #ec4899, #8b5cf6)`;

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col md:flex-row gap-6 p-4 md:p-0">
      {/* Left Panel: Info & Player */}
      <div className="md:w-1/3 flex flex-col gap-6">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-dark-800 rounded-3xl p-6 shadow-2xl border border-white/5">
          <div 
            className="aspect-square rounded-2xl mb-6 shadow-lg flex items-center justify-center relative overflow-hidden group"
            style={{ background: coverGradient }}
          >
            <Disc size={64} className={`text-white/50 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white truncate" title={data.title}>{data.title}</h2>
            <p className="text-brand-400 text-lg font-medium truncate">{data.artist}</p>
            {data.album && <p className="text-gray-500 text-sm mt-1">{data.album} • {data.year}</p>}
          </div>

          {audioSource && audioSource.url && (
            <div className="bg-dark-900/50 rounded-xl p-4">
              <audio 
                ref={audioRef} 
                src={audioSource.url} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
              />

              <div className="flex justify-center mt-4">
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white text-dark-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {data.genre && (
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">
                {data.genre}
              </span>
            )}
            {data.mood && (
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">
                {data.mood}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Lyrics */}
      <div className="md:w-2/3 bg-dark-800/50 rounded-3xl border border-white/5 backdrop-blur-sm flex flex-col overflow-hidden max-h-[80vh] md:max-h-[600px]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-800">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Music size={20} className="text-brand-500" />
            Lyrics
          </h3>
          <button 
             onClick={() => navigator.clipboard.writeText(data.lyrics)}
             className="text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            COPY
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-lg md:text-xl text-center leading-relaxed font-medium text-gray-200">
            {data.lyrics.split('\n').map((line, i) => (
                <p key={i} className={`${line.trim() === '' ? 'h-4' : ''} hover:text-white transition-colors`}>
                    {line}
                </p>
            ))}
            <div className="h-20" /> {/* Spacer */}
        </div>
      </div>
    </div>
  );
};

export default LyricsDisplay;