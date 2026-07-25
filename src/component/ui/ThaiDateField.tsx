import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface ThaiDateFieldProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

const toThaiDisplay = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '';
  return `${pad(d)}/${pad(m)}/${y + 543}`;
};

export const ThaiDateField: React.FC<ThaiDateFieldProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'วัน/เดือน/ปี พ.ศ.',
  autoFocus = false,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const display = toThaiDisplay(value);

  const openPicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        readOnly
        value={display}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onClick={openPicker}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600"
        tabIndex={-1}
      >
        <Calendar size={18} />
      </button>
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
};
