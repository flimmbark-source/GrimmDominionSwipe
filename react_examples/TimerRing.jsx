export function TimerRing({ value, variant = 'hero', label }) {
  const red = variant === 'darkLord';
  return (
    <div className="timerWrap">
      <div className={`gd-timer ${red ? 'red' : ''}`}>{value}s</div>
      {label ? <div className="gd-timer-label">{label}</div> : null}
    </div>
  );
}
