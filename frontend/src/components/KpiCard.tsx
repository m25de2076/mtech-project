interface KpiCardProps {
  label: string;
  value: string;
  detail: string;
}

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
