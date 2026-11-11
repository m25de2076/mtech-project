import type { MelbourneSummary } from '../types';

export function ResearchSummary({ summary }: { summary: MelbourneSummary | null }) {
  if (!summary) return null;
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Melbourne research layer</span>
          <h3>Reported project results</h3>
        </div>
      </div>
      <div className="research-grid">
        <div><span>Dashboard observations</span><strong>{summary.dashboard_observations.toLocaleString()}</strong></div>
        <div><span>Selected locations</span><strong>{summary.selected_locations}</strong></div>
        <div><span>Mean temperature</span><strong>{summary.mean_air_temperature_c.toFixed(2)}°C</strong></div>
        <div><span>Mean humidity</span><strong>{summary.mean_relative_humidity_pct.toFixed(2)}%</strong></div>
        <div><span>High-temperature events</span><strong>{summary.high_temperature_events.toLocaleString()}</strong></div>
        <div><span>ML train / test</span><strong>{summary.prediction_train_rows.toLocaleString()} / {summary.prediction_test_rows.toLocaleString()}</strong></div>
      </div>
      <p className="description-text">{summary.note}</p>
    </div>
  );
}
