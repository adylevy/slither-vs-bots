import React, { useState, useRef, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Menu from './components/Menu';
import HUD from './components/HUD';
import { GameState } from './types';
import { GameEngine } from './services/GameEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);
  const [boostEnergy, setBoostEnergy] = useState(100);
  const [finalScore, setFinalScore] = useState(0);
  
  // Ref to hold the engine instance so we can control it from the UI
  const engineRef = useRef<GameEngine | null>(null);

  const startGame = (botCount: number, difficulty: string) => {
    if (engineRef.current) {
      engineRef.current.initGame(botCount, difficulty);
      engineRef.current.start();
      setGameState(GameState.PLAYING);
    }
  };

  const restartGame = () => {
    setGameState(GameState.MENU);
  };

  const handleGameOver = (finalLength: number) => {
    setFinalScore(finalLength);
    setGameState(GameState.GAME_OVER);
  };

  const handleUpdateUI = (currentScore: number, currentLeaderboard: {name: string, score: number}[], currentEnergy: number) => {
    setScore(currentScore);
    setLeaderboard(currentLeaderboard);
    setBoostEnergy(currentEnergy);
  };

  return (
    <div className="relative w-screen h-screen bg-gray-900 text-white font-sans select-none overflow-hidden">
      <GameCanvas 
        onEngineInit={(engine) => { engineRef.current = engine; }}
        onGameOver={handleGameOver}
        onUpdateUI={handleUpdateUI}
      />
      
      {gameState === GameState.MENU && (
        <Menu onStart={startGame} />
      )}

      {gameState === GameState.PLAYING && (
        <HUD score={score} leaderboard={leaderboard} boostEnergy={boostEnergy} />
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-gray-800 p-8 rounded-xl border-2 border-red-500 shadow-2xl text-center max-w-md w-full">
            <h2 className="text-4xl font-bold mb-2 text-red-500 neon-text">ELIMINATED</h2>
            <p className="text-gray-300 mb-6">You exploded into particles.</p>
            
            <div className="bg-gray-900 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-400">Final Length</p>
              <p className="text-3xl font-mono font-bold text-white">{Math.floor(finalScore)}</p>
            </div>

            <button 
              onClick={restartGame}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;