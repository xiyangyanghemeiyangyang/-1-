import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, Play, Calendar, Music, X } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear, onDelete, onBack }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center text-gray-600">
          <Clock size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-200">No History Yet</h2>
          <p className="text-gray-400 mt-2">Songs you identify will appear here.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-brand-600 text-white rounded-full hover:bg-brand-500 transition-colors"
        >
          Identify a Song
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Clock className="text-brand-400" />
          History
        </h2>
        <button 
          onClick={onClear}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="group bg-dark-800 hover:bg-dark-800/80 border border-white/5 hover:border-brand-500/50 p-4 rounded-xl transition-all cursor-pointer flex items-center gap-6 relative"
          >
            {/* Gradient Icon Placeholder for Cover */}
            <div 
              className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(135deg, ${stringToColor(item.title)} 0%, ${stringToColor(item.artist)} 100%)` }}
            >
              <Music className="text-white/50 group-hover:text-white" size={24} />
            </div>

            <div className="flex-1 min-w-0 mr-8">
              <h3 className="text-xl font-bold text-white truncate group-hover:text-brand-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-400 truncate text-base">{item.artist}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(item.timestamp)}
                </span>
                {item.album && (
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {item.album}
                  </span>
                )}
              </div>
            </div>

            {/* Play and Delete actions */}
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} fill="currentColor" />
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                    }}
                    className="w-10 h-10 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-colors z-10"
                    title="Remove from history"
                >
                    <X size={20} />
                </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

// Helper to generate consistent colors from strings
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default HistoryList;