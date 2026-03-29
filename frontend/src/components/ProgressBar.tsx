export default function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="progress-bar flex-1" style={{ height: 6 }}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
