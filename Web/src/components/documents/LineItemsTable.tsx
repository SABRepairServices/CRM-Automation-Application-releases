'use client';

import { ReactNode, CSSProperties } from 'react';

export interface LineColumn<T> {
  key: keyof T & string;
  label: string;
  /** CSS width for the <th>, e.g. '36%' or '80px'. */
  width?: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  placeholder?: string;
  step?: string;
}

/**
 * The add/remove-row grid used by every document type's items table. The
 * caller owns the row array and supplies a `computed` renderer for any
 * derived column (line amount, pending balance) so the arithmetic stays
 * with the document that defines it rather than being guessed at here.
 */
export function LineItemsTable<T extends Record<string, unknown>>({
  columns,
  rows,
  onChange,
  onAdd,
  addLabel = '＋ Add Line',
  computed,
  computedLabel = 'Amount',
  footer,
  readOnly = false,
}: {
  columns: LineColumn<T>[];
  rows: T[];
  onChange: (next: T[]) => void;
  onAdd: () => void;
  addLabel?: string;
  computed?: (row: T) => string;
  computedLabel?: string;
  footer?: ReactNode;
  readOnly?: boolean;
}) {
  const setCell = (index: number, key: string, value: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="tbl-wrap">
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '28px' }}>#</th>
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
              {computed && <th style={{ width: '13%', textAlign: 'right' }}>{computedLabel}</th>}
              {!readOnly && <th style={{ width: '28px' }} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="row-num">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.type === 'select' ? (
                      <select
                        value={String(row[c.key] ?? '')}
                        disabled={readOnly}
                        onChange={(e) => setCell(i, c.key, e.target.value)}
                      >
                        <option value="">—</option>
                        {(c.options || []).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.type || 'text'}
                        value={String(row[c.key] ?? '')}
                        placeholder={c.placeholder}
                        step={c.step}
                        min={c.type === 'number' ? 0 : undefined}
                        readOnly={readOnly}
                        onChange={(e) => setCell(i, c.key, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                {computed && <td className="amt-cell">{computed(row)}</td>}
                {!readOnly && (
                  <td className="del-cell">
                    <button
                      type="button"
                      style={{ '--ring-clr': '244 63 94' } as CSSProperties}
                      className="del-btn ring-hover ring-hover-circle"
                      aria-label="Remove line"
                      onClick={() => removeRow(i)}
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {footer}
        </table>
      </div>
      {!readOnly && (
        <div className="add-row-bar">
          <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300" onClick={onAdd}>
            {addLabel}
          </button>
        </div>
      )}
    </>
  );
}
