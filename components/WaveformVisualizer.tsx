import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Init Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color based on height
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#0ea5e9'); // brand-500
        gradient.addColorStop(1, '#a855f7'); // purple-500

        ctx.fillStyle = gradient;
        
        // Make bars rounded at top
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, isRecording]);

  return (
    <div className="w-full h-32 bg-dark-800 rounded-xl overflow-hidden border border-gray-700/50 shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={128}
        className="w-full h-full"
      />
    </div>
  );
};

export default WaveformVisualizer;