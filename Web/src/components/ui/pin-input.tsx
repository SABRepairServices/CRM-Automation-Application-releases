'use client';

import { useRef, useEffect } from 'react';

interface PinInputProps {
  length: 4 | 6;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
}

/**
 * A proper PIN pad: one focused box per digit, auto-advances forward on
 * entry and backward on backspace, and accepts a pasted full code in one
 * go. Renders as password-masked boxes so a PIN never shows on screen.
 */
export function PinInput({ length, value, onChange, onComplete, autoFocus }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join('');
    onChange(joined);
    if (joined.length === length) onComplete?.(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      setDigit(index, '');
      return;
    }
    if (clean.length > 1) {
      // Pasted or fast-typed multiple digits — fill forward from here.
      const chars = clean.split('');
      const next = digits.slice();
      let cursor = index;
      for (const c of chars) {
        if (cursor >= length) break;
        next[cursor] = c;
        cursor += 1;
      }
      const joined = next.join('');
      onChange(joined);
      if (joined.length === length) onComplete?.(joined);
      inputRefs.current[Math.min(cursor, length - 1)]?.focus();
      return;
    }
    setDigit(index, clean);
    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, '');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 text-center text-2xl font-semibold bg-slate-950/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      ))}
    </div>
  );
}
