import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../services/GameEngine';

interface GameCanvasProps {
  onEngineInit: (engine: GameEngine) => void;
  onGameOver: (score: number) => void;
  onUpdateUI: (score: number, leaderboard: {name: string, score: number}[]) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onEngineInit, onGameOver, onUpdateUI }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize engine once
    if (!engineRef.current) {
      engineRef.current = new GameEngine(
        canvasRef.current,
        onGameOver,
        onUpdateUI
      );
      onEngineInit(engineRef.current);
    }

    // Ensure canvas is properly sized on mount
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engineRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full cursor-crosshair block"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

export default GameCanvas;