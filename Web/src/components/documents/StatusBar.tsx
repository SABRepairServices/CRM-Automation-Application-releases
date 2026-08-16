'use client';

type Tone = 'gold' | 'green' | 'red' | 'blue' | 'slate';

export interface StatusOption<T extends string> {
  value: T;
  label: string;
  tone: Tone;
}

/**
 * The row of pill buttons the office uses to move a document through its
 * lifecycle. Only the currently-selected option is tinted; the rest stay
 * neutral, so the current state reads at a glance across the page.
 */
export function StatusBar<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: StatusOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="status-bar" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`s-btn ${value === opt.value ? opt.tone : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
