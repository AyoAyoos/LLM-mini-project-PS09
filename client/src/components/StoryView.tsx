import type { Story } from '../types';
import type { PlayerState } from '../hooks/useStoryAudio';
import { Icon } from './icons';

interface StoryViewProps {
  story: Story;
  audioState: PlayerState;
  usedFallback: boolean;
  onToggleAudio: () => void;
  onStopAudio: () => void;
  onNewStory: () => void;
  onRegenerate: () => void;
}

export function StoryView({
  story,
  audioState,
  usedFallback,
  onToggleAudio,
  onStopAudio,
  onNewStory,
  onRegenerate,
}: StoryViewProps) {
  const paragraphs = story.story.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

  const playLabel =
    audioState === 'loading'
      ? 'Preparing audio…'
      : audioState === 'playing'
        ? 'Pause'
        : audioState === 'paused'
          ? 'Resume'
          : 'Read aloud';

  const statusLabel =
    audioState === 'loading'
      ? 'Preparing audio…'
      : audioState === 'playing'
        ? `Reading aloud${usedFallback ? ' with your browser voice' : ''}…`
        : audioState === 'paused'
          ? 'Paused.'
          : 'Ready to read aloud.';

  return (
    <section className="card story-card" aria-labelledby="story-title">
      <div className="card-header">
        <span className="icon-tile" aria-hidden="true">
          <Icon name="book" size={14} />
        </span>
        <h2 id="story-title" className="card-title">
          Your bedtime story
        </h2>
        <span className="pill pill--info card-header-pill">
          <Icon name="check" size={12} />
          <span>Ready</span>
        </span>
      </div>

      <h3 className="story-heading">{story.title}</h3>

      <div className="story-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <p className="story-moral">
        <strong>Moral:</strong> {story.moral}
      </p>

      <div className="story-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onToggleAudio}
          disabled={audioState === 'loading'}
        >
          <Icon
            name={audioState === 'playing' ? 'pause' : audioState === 'loading' ? 'clock' : 'play'}
          />
          <span>{playLabel}</span>
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label="Stop reading"
          onClick={onStopAudio}
          disabled={audioState === 'idle' || audioState === 'loading'}
        >
          <Icon name="stop" />
        </button>
        <button type="button" className="btn-secondary" onClick={onNewStory}>
          <Icon name="plus" />
          <span>New story</span>
        </button>
        <button type="button" className="btn-secondary" onClick={onRegenerate}>
          <Icon name="refresh" />
          <span>Regenerate</span>
        </button>
      </div>

      <p className="player-status" aria-live="polite">
        {statusLabel}
      </p>
    </section>
  );
}
