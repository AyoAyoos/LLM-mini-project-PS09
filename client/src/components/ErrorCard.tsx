import { Icon } from './icons';

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
  onChangeDetails: () => void;
}

export function ErrorCard({ message, onRetry, onChangeDetails }: ErrorCardProps) {
  return (
    <section className="card error-card" role="alert" aria-labelledby="error-title">
      <div className="card-header">
        <span className="icon-tile icon-tile--alert" aria-hidden="true">
          <Icon name="alert" size={14} />
        </span>
        <h2 id="error-title" className="card-title">
          That story got away
        </h2>
      </div>
      <p className="error-message">{message}</p>
      <div className="story-actions">
        <button type="button" className="btn-primary" onClick={onRetry}>
          <Icon name="refresh" />
          <span>Try again</span>
        </button>
        <button type="button" className="btn-secondary" onClick={onChangeDetails}>
          <Icon name="fileText" />
          <span>Change details</span>
        </button>
      </div>
    </section>
  );
}
