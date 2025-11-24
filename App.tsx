import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Music, Loader2, Radio, History as HistoryIcon } from 'lucide-react';
import FileUpload from './components/FileUpload';
import LyricsDisplay from './components/LyricsDisplay';
import WaveformVisualizer from './components/WaveformVisualizer';
import HistoryList from './components/HistoryList';
import { identifySong, fileToBase64 } from './services/geminiService';
import { AppView, ProcessingState, SongMetadata, AudioSource, HistoryItem } from './types';

const HISTORY_KEY = 'lyriclens_history_v1';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [processing, setProcessing] = useState<ProcessingState>({ isProcessing: false, message: '' });
  const [result, setResult] = useState<SongMetadata | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addToHistory = (metadata: SongMetadata) => {
    const newItem: HistoryItem = {
      ...metadata,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    // Prepend new item, limit to 50 items
    const newHistory = [newItem, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your entire song history?')) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    if (confirm('Remove this song from history?')) {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setResult(item);
    setAudioSource(null); // History items don't have stored audio files
    setView(AppView.RESULT);
  };

  const resetApp = () => {
    setView(AppView.HOME);
    setResult(null);
    setAudioSource(null);
    setErrorMsg(null);
    stopRecording();
  };

  const handleFileUpload = async (file: File) => {
    try {
      setProcessing({ isProcessing: true, message: 'Encoding audio...' });
      const base64 = await fileToBase64(file);
      const url = URL.createObjectURL(file);
      
      setAudioSource({
        type: 'file',
        data: base64,
        mimeType: file.type,
        url: url,
        fileName: file.name
      });

      setProcessing({ isProcessing: true, message: 'Asking Gemini to identify song & extract lyrics...' });
      const metadata = await identifySong(base64, file.type);
      
      setResult(metadata);
      addToHistory(metadata);
      setView(AppView.RESULT);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to identify song.');
      setView(AppView.ERROR);
    } finally {
      setProcessing({ isProcessing: false, message: '' });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setView(AppView.RECORD);
      
      // Timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          // Optional: Auto stop logic could go here
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error(err);
      setErrorMsg("Microphone access denied.");
      setView(AppView.ERROR);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const stopRecordingAndAnalyze = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
      stopRecording(); // Cleanup streams
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];

        setAudioSource({
          type: 'recording',
          data: base64,
          mimeType: 'audio/webm',
          url: url
        });

        try {
          setProcessing({ isProcessing: true, message: 'Analyzing audio fingerprint...' });
          const metadata = await identifySong(base64, 'audio/webm');
          setResult(metadata);
          addToHistory(metadata);
          setView(AppView.RESULT);
        } catch (err: any) {
           setErrorMsg(err.message || "Could not identify song.");
           setView(AppView.ERROR);
        } finally {
          setProcessing({ isProcessing: false, message: '' });
        }
      };
    };
    
    mediaRecorderRef.current.stop();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // UI Renders
  if (processing.isProcessing) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <Loader2 size={64} className="text-brand-500 animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-semibold animate-pulse">{processing.message}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans selection:bg-brand-500/30 pb-10">
      
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto z-50 relative">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={resetApp}>
          <div className="bg-brand-600 p-2 rounded-lg group-hover:bg-brand-500 transition-colors">
             <Radio size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">
            LyricLens
          </h1>
        </div>
        
        {view !== AppView.HISTORY && (
          <button 
            onClick={() => setView(AppView.HISTORY)}
            className="flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all"
          >
            <HistoryIcon size={18} />
            <span className="hidden sm:inline">History</span>
          </button>
        )}
      </header>

      <main className="container mx-auto px-4 py-4">
        
        {/* VIEW: HOME */}
        {view === AppView.HOME && (
          <div className="flex flex-col items-center justify-center space-y-12 mt-6">
            <div className="text-center space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
                Identify Songs <br/>
                <span className="text-brand-500">Instantly.</span>
              </h1>
              <p className="text-xl text-gray-400">
                Upload a track or hum a tune. We'll find the lyrics and details for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              {/* Option 1: Upload */}
              <div 
                className="bg-dark-800 hover:bg-dark-800/80 p-8 rounded-3xl border border-white/5 transition-all duration-300 hover:scale-[1.02] group cursor-default"
              >
                <div className="bg-brand-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-brand-400 group-hover:text-white transition-colors">
                  <Upload size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Upload Audio</h3>
                <p className="text-gray-400 mb-6">MP3, WAV, FLAC, M4A up to 100MB.</p>
                <FileUpload onFileSelect={handleFileUpload} />
              </div>

              {/* Option 2: Listen */}
              <button 
                onClick={startRecording}
                className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 hover:from-purple-800/50 hover:to-indigo-800/50 p-8 rounded-3xl border border-white/5 transition-all duration-300 hover:scale-[1.02] text-left group relative overflow-hidden h-full flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                
                <div className="bg-purple-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:text-white transition-colors">
                  <Mic size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Identify Song</h3>
                <p className="text-gray-400 mb-6 flex-grow">Use your microphone to listen to music playing nearby.</p>
                <div className="flex items-center gap-2 text-purple-300 font-semibold group-hover:translate-x-2 transition-transform">
                  Start Listening <Music size={16} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: RECORDING */}
        {view === AppView.RECORD && (
          <div className="flex flex-col items-center justify-center mt-20 space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-brand-500/20 animate-ping absolute inset-0" />
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center relative shadow-[0_0_40px_rgba(14,165,233,0.5)]">
                 <Mic size={64} className="text-white animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Listening...</h2>
              <p className="text-gray-400">Keep the music playing</p>
            </div>

            <div className="w-full max-w-2xl">
               <WaveformVisualizer stream={streamRef.current} isRecording={isRecording} />
            </div>

            <div className="text-xl font-mono text-brand-400">
               00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime} 
            </div>

            <button 
              onClick={stopRecordingAndAnalyze}
              className="px-8 py-3 bg-white text-dark-900 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
            >
              Stop & Identify
            </button>
          </div>
        )}

        {/* VIEW: RESULT */}
        {view === AppView.RESULT && result && (
          <div className="animate-in slide-in-from-right duration-500">
            <LyricsDisplay data={result} audioSource={audioSource} onReset={resetApp} />
          </div>
        )}

        {/* VIEW: HISTORY */}
        {view === AppView.HISTORY && (
          <div className="animate-in slide-in-from-right duration-500 pt-4">
             <div className="mb-6 flex">
               <button 
                  onClick={resetApp}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <HistoryIcon size={20} className="rotate-180" /> Back to Home
                </button>
             </div>
             <HistoryList 
                history={history} 
                onSelect={handleSelectHistoryItem} 
                onClear={clearHistory}
                onDelete={handleDeleteHistoryItem}
                onBack={resetApp}
             />
          </div>
        )}

        {/* VIEW: ERROR */}
        {view === AppView.ERROR && (
           <div className="flex flex-col items-center justify-center mt-20 space-y-6 text-center animate-in zoom-in duration-300">
             <div className="bg-red-500/10 p-6 rounded-full text-red-500">
               <Radio size={48} />
             </div>
             <h2 className="text-3xl font-bold">Oops!</h2>
             <p className="text-gray-400 max-w-md">{errorMsg}</p>
             <button 
                onClick={resetApp}
                className="px-8 py-3 bg-brand-600 rounded-full font-bold hover:bg-brand-500 transition-colors text-white"
              >
                Try Again
              </button>
           </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 w-full p-4 text-center text-gray-600 text-sm pointer-events-none bg-gradient-to-t from-dark-900 to-transparent">
        Powered by Google Gemini 2.5 Flash
      </footer>
    </div>
  );
};

export default App;