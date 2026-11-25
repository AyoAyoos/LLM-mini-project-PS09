import { useState } from 'react';
import { getAgeBand } from '../constants';
import type { StoryRequest } from '../types';
import { Icon } from './icons';
import { MoralChips } from './MoralChips';
import { TagInput } from './TagInput';

interface StoryFormProps {
  age: number;
  characters: string[];
  moral: string;
  selectedPreset: string | null;
  moralFilter: string;
  loading: boolean;
  onAgeChange: (age: number) => void;
  onCharactersChange: (characters: string[]) => void;
  onMoralChange: (moral: string) => void;
  onSelectPreset: (moral: string) => void;
  onSubmit: (request: StoryRequest) => void;
}

export function StoryForm({
  age,
  characters,
  moral,
  selectedPreset,
  moralFilter,
  loading,
  onAgeChange,
  onCharactersChange,
  onMoralChange,
  onSelectPreset,
  onSubmit,
}: StoryFormProps) {
  const [error, setError] = useState('');
  const band = getAgeBand(age);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (characters.length === 0) {
      setError('Add at least one character to begin.');
      return;
    }
    if (!moral.trim()) {
      setError('Choose a preset moral or write your own.');
      return;
    }
    setError('');
    onSubmit({ age, characters, moral: moral.trim() });
  }

  return (
    <section className="card" aria-labelledby="composer-title">
      <div className="card-header">
        <span className="icon-tile" aria-hidden="true">
          <Icon name="sparkles" size={14} />
        </span>
        <h2 id="composer-title" className="card-title">
          Story composer
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="age">
            Age
          </label>
          <div className="slider-row">
            <input
              id="age"
              type="range"
              min={2}
              max={10}
              step={1}
              value={age}
              disabled={loading}
              aria-valuetext={`${age} years old`}
              aria-describedby="age-hint"
              onChange={(event) => onAgeChange(Number(event.target.value))}
            />
            <span className="pill pill--info">{age} years</span>
          </div>
          <p id="age-hint" className="field-hint">
            {band.label} · {band.words}
          </p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="characters">
            Characters
          </label>
          <TagInput
            id="characters"
            value={characters}
            onChange={onCharactersChange}
            disabled={loading}
          />
        </div>

        <MoralChips
          selected={selectedPreset ?? ''}
          filter={moralFilter}
          customValue={selectedPreset === null ? moral : ''}
          onSelect={onSelectPreset}
          onCustomChange={onMoralChange}
          disabled={loading}
        />

        {error && (
          <p className="form-error" role="alert">
            <Icon name="alert" size={14} />
            <span>{error}</span>
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            <Icon name={loading ? 'clock' : 'sparkles'} />
            <span>{loading ? 'Making your story…' : 'Tell me a story'}</span>
          </button>
          <p className="form-note">A calm story in a few seconds. No account needed.</p>
        </div>
      </form>
    </section>
  );
}
