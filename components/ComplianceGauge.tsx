
import { type FC } from 'react';

interface ComplianceGaugeProps {
  percentage: number;
}

const ComplianceGauge: FC<ComplianceGaugeProps> = ({ percentage }) => {
  // SVG drawing logic for a semi-circle gauge
  const radius = 90;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; 
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center h-32 w-full max-w-[200px]">
      <svg
        viewBox={`0 0 ${radius * 2} ${radius}`}
        className="w-full transform -rotate-0"
        style={{ overflow: 'visible' }}
      >
        {/* Background Track */}
        <path
          d={`M ${strokeWidth/2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth/2},${radius}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated Progress Track */}
        <path
          d={`M ${strokeWidth/2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth/2},${radius}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Content */}
      <div className="absolute top-[45%] flex flex-col items-center">
        <span className="text-5xl font-black text-primary leading-none tracking-tight">
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
