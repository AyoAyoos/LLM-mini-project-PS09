import { getAgeBand, TTS_VOICE_LABEL } from '../constants';
import { Icon } from './icons';

interface DetailPanelProps {
  age: number;
  characters: string[];
  moral: string;
  onCopyVoice: () => void;
  onToggleTips: () => void;
}

export function DetailPanel({ age, characters, moral, onCopyVoice, onToggleTips }: DetailPanelProps) {
  const band = getAgeBand(age);

  return (
    <details className="detail-panel" open>
      <summary className="detail-summary">Story details</summary>

      <div className="detail-content">
        <div className="detail-header">
          <span className="detail-emoji" aria-hidden="true">
            🌙
          </span>
          <h2 className="card-title">Story settings</h2>
          <button
            type="button"
            className="btn-icon btn-icon--ghost"
            aria-label="More story tips"
            onClick={onToggleTips}
          >
            <Icon name="info" />
          </button>
        </div>

        <section className="detail-section">
          <h3 className="detail-label">About</h3>
          <p className="detail-copy">
            A short, calm story made for bedtime. Pick an age, a few characters and the lesson you
            would like to share.
          </p>
        </section>

        <section className="detail-section">
          <h3 className="detail-label">Age band</h3>
          <input
            className="read-only-input"
            readOnly
            aria-label="Selected age band"
            value={`${band.label} · ${band.words}`}
          />
        </section>

        <section className="detail-section">
          <h3 className="detail-label">Characters</h3>
          {characters.length === 0 ? (
            <p className="detail-copy muted">None added yet.</p>
          ) : (
            <ul className="detail-chips">
              {characters.map((character) => (
                <li key={character} className="chip">
                  {character}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <h3 className="detail-label">Moral</h3>
          <input
            className="read-only-input"
            readOnly
            aria-label="Selected moral"
            value={moral || 'Not chosen yet'}
          />
        </section>

        <section className="detail-section">
          <h3 className="detail-label">Voice</h3>
          <div className="read-only-row">
            <input
              className="read-only-input"
              readOnly
              aria-label="Narrator voice"
              value={`${TTS_VOICE_LABEL} · Gemini TTS`}
            />
            <button
              type="button"
              className="btn-icon btn-icon--ghost"
              aria-label="Copy voice name"
              onClick={onCopyVoice}
            >
              <Icon name="copy" />
            </button>
          </div>
          <p className="detail-copy muted">Browser voice is used automatically if needed.</p>
        </section>
      </div>
    </details>
  );
}
