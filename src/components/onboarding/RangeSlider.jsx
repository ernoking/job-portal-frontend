import React from 'react';
import './RangeSlider.css';

export default function RangeSlider({
  value = 80,
  min = 30,
  max = 100,
  onChange,
  id = 'match-quality-slider',
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="range-slider-wrapper">
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--lime, #DDF86B) 0%, var(--lime, #DDF86B) ${percentage}%, var(--slider-rest, #1B3A2B) ${percentage}%, var(--slider-rest, #1B3A2B) 100%)`,
        }}
        className="range-slider-input"
        aria-label="Minimum match quality percentage"
        data-testid="match-quality-slider"
      />
    </div>
  );
}
