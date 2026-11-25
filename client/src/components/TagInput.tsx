import { useState } from 'react';
import { Icon } from './icons';

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({ id, value, onChange, disabled = false }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  function addTag(raw: string) {
    const cleaned = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!cleaned) return;
    if (value.length >= 4) {
      setError('You can add up to 4 characters.');
      return;
    }
    if (value.some((tag) => tag.toLowerCase() === cleaned.toLowerCase())) {
      setError('That character is already in the story.');
      return;
    }
    onChange([...value, cleaned]);
    setDraft('');
    setError('');
  }

  return (
    <div>
      <div className={`tag-input${error ? ' has-error' : ''}`}>
        {value.map((tag) => (
          <span key={tag} className="chip tag-chip">
            <span>{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          disabled={disabled}
          maxLength={40}
          placeholder={value.length === 0 ? 'e.g. Tara the turtle' : 'Add another...'}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag(draft);
            } else if (event.key === 'Backspace' && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            } else if (event.key === 'Escape') {
              setDraft('');
            }
          }}
        />
      </div>
      <p id={`${id}-hint`} className={`field-hint${error ? ' field-error' : ''}`}>
        {error || `Press Enter to add. Up to 4 characters, 40 letters each. ${value.length}/4 added.`}
      </p>
    </div>
  );
}
