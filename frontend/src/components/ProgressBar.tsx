export default function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm font-bold" style={{ color: "var(--blue)" }}>
        {Math.round(percent)}%
      </span>
      <div className="progress-bar flex-1" style={{ height: 10 }}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
