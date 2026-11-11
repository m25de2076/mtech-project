import type { RegionalSummary } from '../types';

export function RegionalPanel({ summary }: { summary: RegionalSummary | null }) {
  if (!summary) return null;
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">NWDP Karnataka</span>
          <h3>Regional heat context</h3>
        </div>
      </div>
      <div className="research-grid">
        <div><span>Valid hourly observations</span><strong>{summary.headline.valid_hourly_observations.toLocaleString()}</strong></div>
        <div><span>Retained stations</span><strong>{summary.headline.retained_stations}</strong></div>
        <div><span>Valid station-days</span><strong>{summary.headline.valid_station_days.toLocaleString()}</strong></div>
        <div><span>Long-record stations</span><strong>{summary.headline.long_record_stations}</strong></div>
      </div>
      <p className="description-text">{summary.interpretation}</p>
      <div className="table-scroll">
        <table className="zone-table">
          <thead><tr><th>Station</th><th>Valid days</th><th>P95 hourly</th><th>Hours ≥35°C</th><th>Day-night</th></tr></thead>
          <tbody>
            {summary.top_stations.map((station) => (
              <tr key={station.station}>
                <td><strong>{station.station}</strong></td>
                <td>{station.valid_days}</td>
                <td>{station.p95_hourly_c.toFixed(2)}°C</td>
                <td>{station.hours_ge_35_pct.toFixed(2)}%</td>
                <td>{station.day_night_c.toFixed(2)}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="method-list">
        {summary.methodology.map((item) => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}
