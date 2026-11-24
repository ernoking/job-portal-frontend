import React from 'react';
import './ScoreRing.css';

export default function ScoreRing({ score = 92, size = 60, strokeWidth = 4.5, stroke }) {
  const actualStroke = stroke ?? strokeWidth;
  const isLarge = size >= 68;
  const radius = (size - actualStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`score-ring-wrap ${isLarge ? 'score-ring-lg' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="score-ring-svg">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5EAE2"
          strokeWidth={actualStroke}
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#C6F851"
          strokeWidth={actualStroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring-content">
        <span className="score-ring-number">{score}%</span>
        <span className="score-ring-unit">fit</span>
      </div>
    </div>
  );
}
