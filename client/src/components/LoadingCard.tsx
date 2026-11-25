import { Icon } from './icons';

export function LoadingCard() {
  return (
    <section className="card loading-card" role="status" aria-live="polite">
      <div className="card-header">
        <span className="icon-tile" aria-hidden="true">
          <Icon name="clock" size={14} />
        </span>
        <h2 className="card-title">Making your story</h2>
      </div>
      <div className="loading-body">
        <span className="spinner" aria-hidden="true" />
        <div>
          <p className="loading-title">Tucking the words into place…</p>
          <p className="detail-copy muted">
            This usually takes a few seconds. The button is paused while we write.
          </p>
        </div>
      </div>
    </section>
  );
}
