import React, { useState } from 'react';
import { CONFIG } from '../constants';

interface MenuProps {
  onStart: (botCount: number, difficulty: string) => void;
}

const Menu: React.FC<MenuProps> = ({ onStart }) => {
  const [botCount, setBotCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Normal');

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
      <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        
        <h1 className="text-5xl font-black text-center mb-2 tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          SLITHER<span className="text-purple-400">.VS</span>
        </h1>
        <p className="text-center text-gray-400 mb-8 font-mono">NEON ARENA SURVIVAL</p>

        <div className="space-y-6">
          
          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="text-sm uppercase font-bold text-gray-500 tracking-wider">Difficulty</label>
            <div className="flex gap-2">
              {['Easy', 'Normal', 'Hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    difficulty === d 
                      ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] scale-105' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Bot Count Slider */}
          <div className="space-y-2">
             <div className="flex justify-between">
              <label className="text-sm uppercase font-bold text-gray-500 tracking-wider">Opponents</label>
              <span className="font-mono text-purple-400 font-bold">{botCount}</span>
             </div>
             <input 
               type="range" 
               min="5" 
               max="30" 
               value={botCount} 
               onChange={(e) => setBotCount(parseInt(e.target.value))}
               className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
             />
          </div>

          {/* Start Button */}
          <button 
            onClick={() => onStart(botCount, difficulty)}
            className="w-full bg-white text-black font-black text-xl py-4 rounded-xl hover:bg-gray-200 transition-transform active:scale-95 shadow-xl mt-4"
          >
            ENTER ARENA
          </button>
          
          <div className="text-xs text-center text-gray-600 pt-4">
            Mouse to steer • Hold click to boost
          </div>

        </div>
      </div>
    </div>
  );
};

export default Menu;