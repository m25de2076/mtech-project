import { CheckCircle2, Server } from 'lucide-react';
import type { ModelInfo } from '../types';

interface ModelPanelProps {
  model: ModelInfo | null;
}

export function ModelPanel({ model }: ModelPanelProps) {
  if (!model) return <div className="panel">Loading model metadata…</div>;
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Production model</span>
          <h3>{model.name}</h3>
        </div>
        <span className={`model-state ${model.model_loaded ? 'loaded' : 'failed'}`}>
          {model.model_loaded ? <CheckCircle2 size={16} /> : <Server size={16} />}
          {model.model_loaded ? 'Loaded' : 'Unavailable'}
        </span>
      </div>
      <div className="model-metrics">
        <div><span>MAE</span><strong>{model.reported_metrics.mae_c.toFixed(3)}°C</strong></div>
        <div><span>RMSE</span><strong>{model.reported_metrics.rmse_c.toFixed(3)}°C</strong></div>
        <div><span>R²</span><strong>{model.reported_metrics.r2.toFixed(3)}</strong></div>
      </div>
      <p className="description-text">{model.validation_note}</p>
      <div className="subgrid">
        <div className="subpanel">
          <span className="eyebrow">Model configuration</span>
          <dl className="definition-list">
            {Object.entries(model.hyperparameters).map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
            ))}
          </dl>
        </div>
        <div className="subpanel">
          <span className="eyebrow">Native feature schema</span>
          <div className="feature-chip-grid">
            {model.feature_names.map((feature) => <span key={feature}>{feature}</span>)}
          </div>
        </div>
      </div>
      <div className="importance-list">
        <span className="eyebrow">Feature importance from saved model</span>
        {model.feature_importance.map((item) => (
          <div className="importance-row" key={item.feature}>
            <span>{item.feature}</span>
            <div><i style={{ width: `${Math.max(2, item.importance * 100)}%` }} /></div>
            <b>{(item.importance * 100).toFixed(1)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
