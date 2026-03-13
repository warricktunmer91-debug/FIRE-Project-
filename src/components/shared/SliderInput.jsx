import React from 'react';

/**
 * Labelled slider with live value display.
 */
export default function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  format = (v) => v,
  onChange,
  hint,
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs text-slate-400 uppercase tracking-wide">{label}</label>
        <span className="text-sm font-semibold text-blue-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-slate-600 mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
