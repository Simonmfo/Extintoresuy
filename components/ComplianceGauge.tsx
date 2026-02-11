
import React from 'react';

interface ComplianceGaugeProps {
  percentage: number;
}

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({ percentage }) => {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <div className="relative w-48 h-24 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 160 85"
          className="w-full h-full transform translate-y-4"
        >
          {/* Background Track */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Animated Progress Track */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Content */}
        <div className="absolute top-[35%] flex flex-col items-center">
          <span className="text-4xl font-black text-primary leading-none tracking-tight">
            {percentage}%
          </span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">
            Cumplimiento
          </span>
        </div>
      </div>
    </div>
  );
};

export default ComplianceGauge;
