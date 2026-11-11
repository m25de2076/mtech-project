import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { ReplayState } from '../types';

interface ReplayControlsProps {
  replay: ReplayState | null;
  onControl: (payload: { action?: 'play' | 'pause' | 'reset' | 'step'; speed?: number }) => void;
}

export function ReplayControls({ replay, onControl }: ReplayControlsProps) {
  const speeds = [1, 10, 50, 100];
  return (
    <div className="replay-controls">
      <div className="control-buttons">
        <button className="icon-button" onClick={() => onControl({ action: replay?.playing ? 'pause' : 'play' })}>
          {replay?.playing ? <Pause size={17} /> : <Play size={17} />}
          {replay?.playing ? 'Pause' : 'Play'}
        </button>
        <button className="icon-button" onClick={() => onControl({ action: 'step' })}>
          <SkipForward size={17} /> Step
        </button>
        <button className="icon-button" onClick={() => onControl({ action: 'reset' })}>
          <RotateCcw size={17} /> Reset
        </button>
      </div>
      <div className="speed-group">
        {speeds.map((speed) => (
          <button
            key={speed}
            className={`speed-button ${replay?.speed === speed ? 'active' : ''}`}
            onClick={() => onControl({ speed })}
          >
            {speed}×
          </button>
        ))}
      </div>
    </div>
  );
}
