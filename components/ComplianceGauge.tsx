
import React from 'react';

interface ComplianceGaugeProps {
  percentage: number;
}

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({ percentage }) => {
  // SVG drawing logic for a semi-circle gauge
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; // Length of semi-circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center h-28 w-48 overflow-hidden">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-180"
        style={{ overflow: 'visible' }}
      >
        {/* Background Track */}
        <circle
          stroke="rgba(255,255,255,0.05)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated Progress Track */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-out"
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      {/* Content */}
      <div className="absolute top-[40%] flex flex-col items-center">
        <span className="text-4xl font-black text-primary leading-none tracking-tight">
          {percentage}%
        </span>
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">
          Cumplimiento
        </span>
      </div>
    </div>
  );
};

export default ComplianceGauge;
