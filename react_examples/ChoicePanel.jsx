const statIcons = {
  stealth: '🕶',
  combat: '⚔',
  cunning: '👁',
  spirit: '✦',
  survival: '🐾',
};

export function ChoicePanel({ side = 'left', title, stat, timeCost, failThreshold, greatThreshold }) {
  return (
    <button className={`gd-choice ${side}`}>
      <div className="gd-choice-title">{title}</div>
      <div className="gd-choice-mid">
        <div className="gd-choice-icon"><span>{statIcons[stat] ?? '◆'}</span></div>
        <span>⌛ {timeCost}s</span>
      </div>
      <div className="gd-thresholds">
        <span className="gd-fail">☠ {failThreshold}</span>
        <span className="gd-great">♛ {greatThreshold}</span>
      </div>
    </button>
  );
}
