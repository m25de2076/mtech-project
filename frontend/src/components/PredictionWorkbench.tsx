import { useState } from 'react';
import type { ResearchPredictionInput, ResearchPredictionOutput } from '../types';

interface PredictionWorkbenchProps {
  prediction: ResearchPredictionOutput | null;
  onPredict: (payload: ResearchPredictionInput) => Promise<void>;
}

const initial: ResearchPredictionInput = {
  relative_humidity: 65,
  avg_wind_speed: 2.4,
  pressure_hpa: 1012,
  pm25: 12,
  pm10: 24,
  noise: 58,
  hour: 14,
  dayofweek: 2,
  month: 2,
  latitude: -37.8136,
  longitude: 144.9631,
};

export function PredictionWorkbench({ prediction, onPredict }: PredictionWorkbenchProps) {
  const [payload, setPayload] = useState(initial);
  const update = (key: keyof ResearchPredictionInput, value: number) => setPayload({ ...payload, [key]: value });

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Native model inference</span>
          <h3>Melbourne prediction workbench</h3>
        </div>
      </div>
      <div className="form-grid compact">
        {(Object.keys(payload) as Array<keyof ResearchPredictionInput>).map((key) => (
          <label key={key}>
            {key.replace(/_/g, ' ')}
            <input
              type="number"
              step={['hour', 'dayofweek', 'month'].includes(key) ? 1 : 0.1}
              value={payload[key]}
              onChange={(event) => update(key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
      <button className="primary-button" onClick={() => onPredict(payload)}>Run Random Forest prediction</button>
      {prediction && (
        <div className="prediction-result">
          <span className="eyebrow">Predicted air temperature</span>
          <strong>{prediction.predicted_temperature_c.toFixed(2)}°C</strong>
          <small>Model: {prediction.model_name}</small>
        </div>
      )}
    </div>
  );
}
