import type { TwinZoneReading } from '../types';

interface ZoneTableProps {
  zones: TwinZoneReading[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string) => void;
}

export function ZoneTable({ zones, selectedZoneId, onSelect }: ZoneTableProps) {
  return (
    <div className="panel table-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Live replay telemetry</span>
          <h3>Micro-zone matrix</h3>
        </div>
      </div>
      <div className="table-scroll">
        <table className="zone-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Type</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>Solar</th>
              <th>Wind</th>
              <th>Hotspot index</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr
                key={zone.zone_id}
                className={selectedZoneId === zone.zone_id ? 'selected' : ''}
                onClick={() => onSelect(zone.zone_id)}
              >
                <td><strong>{zone.zone_name}</strong><span>{zone.zone_id}</span></td>
                <td>{zone.zone_type}</td>
                <td>{zone.air_temp_c.toFixed(1)}°C</td>
                <td>{zone.relative_humidity.toFixed(0)}%</td>
                <td>{zone.solar_radiation_wm2.toFixed(0)} W/m²</td>
                <td>{zone.wind_speed_ms.toFixed(1)} m/s</td>
                <td>{zone.hotspot_index.toFixed(1)}</td>
                <td><span className={`status-pill ${zone.status}`}>{zone.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
