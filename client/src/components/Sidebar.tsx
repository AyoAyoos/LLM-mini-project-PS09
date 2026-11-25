import { Icon } from './icons';
import { SIDEBAR_PRESETS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  moralFilter: string;
  onMoralFilterChange: (value: string) => void;
  selectedMoral: string;
  onSelectMoral: (moral: string) => void;
  onShowForm: () => void;
  showTips: boolean;
  onToggleTips: () => void;
  onNotify: (message: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  moralFilter,
  onMoralFilterChange,
  selectedMoral,
  onSelectMoral,
  onShowForm,
  showTips,
  onToggleTips,
  onNotify,
}: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar${isOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
        <div className="workspace-switcher">
          <span className="app-icon-tile" aria-hidden="true">
            <Icon name="sparkles" size={14} />
          </span>
          <span className="workspace-name">Bedtime</span>
          <Icon name="chevronDown" className="muted" />
        </div>

        <div className="sidebar-search">
          <Icon name="search" className="muted" />
          <label className="sr-only" htmlFor="moral-search">
            Search preset morals
          </label>
          <input
            id="moral-search"
            type="search"
            placeholder="Search morals..."
            value={moralFilter}
            onChange={(event) => onMoralFilterChange(event.target.value)}
          />
        </div>

        <nav className="nav-group" aria-label="Main menu">
          <p className="nav-group-label">Main Menu</p>
          <button type="button" className="nav-item is-active" onClick={onShowForm}>
            <Icon name="book" />
            <span>Story studio</span>
          </button>
          <button
            type="button"
            className={`nav-item${showTips ? ' is-active' : ''}`}
            onClick={onToggleTips}
          >
            <Icon name="info" />
            <span>Tips</span>
          </button>
        </nav>

        <nav className="nav-group" aria-label="Collections">
          <p className="nav-group-label">Collections</p>
          <p className="nav-item nav-parent">
            <Icon name="heart" />
            <span>Favourite morals</span>
          </p>
          {SIDEBAR_PRESETS.map((moral) => (
            <button
              key={moral}
              type="button"
              className={`nav-item nav-child${selectedMoral === moral ? ' is-active' : ''}`}
              onClick={() => onSelectMoral(moral)}
            >
              <span>{moral}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item" onClick={onToggleTips}>
            <Icon name="fileText" />
            <span>Knowledge hub</span>
          </button>
          <span className="nav-item is-disabled" aria-disabled="true">
            <Icon name="userPlus" />
            <span>Invite team</span>
          </span>
          <span className="nav-item is-disabled" aria-disabled="true">
            <Icon name="settings" />
            <span>Settings</span>
          </span>
          <button
            type="button"
            className="nav-item"
            onClick={() => onNotify('No new notifications. Sweet dreams!')}
          >
            <Icon name="bell" />
            <span>Notifications</span>
          </button>
        </div>
      </aside>
    </>
  );
}
