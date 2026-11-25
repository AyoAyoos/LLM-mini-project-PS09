import { Icon } from './icons';

interface SubHeaderProps {
  onClear: () => void;
  onToggleTips: () => void;
}

export function SubHeader({ onClear, onToggleTips }: SubHeaderProps) {
  return (
    <div className="subheader">
      <h1 className="section-header">Overview</h1>
      <div className="subheader-actions">
        <button type="button" className="btn-secondary" onClick={onClear}>
          <Icon name="refresh" />
          <span>Clear form</span>
        </button>
        <button type="button" className="btn-secondary" onClick={onToggleTips}>
          <Icon name="info" />
          <span>Tips</span>
        </button>
      </div>
    </div>
  );
}
