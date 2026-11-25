import { Icon } from './icons';

interface TopbarProps {
  onToggleSidebar: () => void;
  onToggleTips: () => void;
  onNotify: (message: string) => void;
}

export function Topbar({ onToggleSidebar, onToggleTips, onNotify }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="btn-icon menu-button"
          aria-label="Open navigation"
          onClick={onToggleSidebar}
        >
          <Icon name="menu" />
        </button>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>Library</span>
          <Icon name="chevronRight" className="muted" />
          <span aria-current="page">Story Generator</span>
        </nav>
      </div>

      <div className="topbar-actions">
        <button type="button" className="btn-secondary" onClick={onToggleTips}>
          <Icon name="info" />
          <span>How it works</span>
        </button>
        <span className="pill pill--info">
          <Icon name="moon" />
          <span>Bedtime mode</span>
        </span>
        <button
          type="button"
          className="btn-icon"
          aria-label="Help and tips"
          onClick={onToggleTips}
        >
          <Icon name="help" />
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label="Notifications"
          onClick={() => onNotify('No new notifications. Sweet dreams!')}
        >
          <Icon name="bell" />
        </button>
        <span className="avatar avatar--purple" role="img" aria-label="Parent profile">
          P
        </span>
      </div>
    </header>
  );
}
