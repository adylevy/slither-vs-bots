import React from 'react';

interface HUDProps {
  score: number;
  leaderboard: {name: string, score: number}[];
  boostEnergy: number;
}

const HUD: React.FC<HUDProps> = ({ score, leaderboard, boostEnergy }) => {
  return (
    <>
      {/* Top Center Nitro Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 w-64 flex flex-col items-center">
        <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1 shadow-black drop-shadow-md">
          Nitro Mode
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-100 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, boostEnergy))}%` }}
          />
        </div>
        <div className={`mt-1 text-[10px] font-bold tracking-widest ${boostEnergy < 20 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
          {boostEnergy <= 0 ? 'DEPLETED' : 'HOLD SPACE'}
        </div>
        {/* Score Display */}
        <div className="mt-3 text-sm font-bold text-gray-400 uppercase tracking-widest">Score</div>
        <div className="text-2xl font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
          {score}
        </div>
      </div>

      {/* Score / Length */}
      <div className="absolute bottom-6 left-6 z-40">
        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Length</div>
        <div className="text-4xl font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
          {score}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="absolute top-6 right-6 z-40 w-56">
        <div className="bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-gray-700">
            Leaderboard
          </h3>
          <ul className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <li key={idx} className="flex justify-between items-center text-sm">
                <span className={`font-bold ${entry.name === 'You' ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {idx + 1}. {entry.name}
                </span>
                <span className="font-mono text-gray-500">{entry.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default HUD;