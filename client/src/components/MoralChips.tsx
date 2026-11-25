import { MORAL_PRESETS } from '../constants';

interface MoralChipsProps {
  selected: string;
  filter: string;
  customValue: string;
  onSelect: (moral: string) => void;
  onCustomChange: (value: string) => void;
  disabled?: boolean;
}

export function MoralChips({
  selected,
  filter,
  customValue,
  onSelect,
  onCustomChange,
  disabled = false,
}: MoralChipsProps) {
  const query = filter.trim().toLowerCase();
  const presets = MORAL_PRESETS.filter((moral) => moral.toLowerCase().includes(query));

  return (
    <fieldset className="moral-fieldset" disabled={disabled}>
      <legend className="field-label">Moral</legend>

      <div className="chip-row" role="group" aria-label="Preset morals">
        {presets.length === 0 ? (
          <p className="field-hint">No preset matches “{filter}”. Write your own below.</p>
        ) : (
          presets.map((moral) => (
            <button
              key={moral}
              type="button"
              className={`chip chip--selectable${selected === moral ? ' is-selected' : ''}`}
              aria-pressed={selected === moral}
              onClick={() => onSelect(moral)}
            >
              {moral}
            </button>
          ))
        )}
      </div>

      <div className="custom-moral">
        <label className="field-label field-label--small" htmlFor="custom-moral">
          Or write your own
        </label>
        <input
          id="custom-moral"
          type="text"
          value={customValue}
          maxLength={80}
          placeholder="e.g. It is okay to ask for help"
          onChange={(event) => onCustomChange(event.target.value)}
        />
        <p className="field-hint">{customValue.length}/80 characters</p>
      </div>
    </fieldset>
  );
}
