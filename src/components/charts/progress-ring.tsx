'use client';

interface ProgressRingProps {
  /** 0–100 */
  percentage: number;
  /** ring color */
  color: string;
  /** ring track color */
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  value: string;
}

export function ProgressRing({
  percentage,
  color,
  trackColor = '#1E1E1E',
  size = 120,
  strokeWidth = 8,
  label,
  value,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="text-center -mt-[calc(50%+12px)] mb-[calc(50%-12px)]">
        <p className="text-xl font-bold text-text-primary">{value}</p>
        <p className="text-[10px] text-text-muted uppercase tracking-[1px]">{label}</p>
      </div>
    </div>
  );
}

interface DualProgressRingProps {
  outerPercentage: number;
  outerColor?: string;
  outerLabel: string;
  outerValue: string;
  innerPercentage: number;
  innerColor?: string;
  innerLabel: string;
  innerValue: string;
  size?: number;
}

export function DualProgressRing({
  outerPercentage,
  outerColor = '#B4F000',
  outerLabel,
  outerValue,
  innerPercentage,
  innerColor = '#7ED957',
  innerLabel,
  innerValue,
  size = 160,
}: DualProgressRingProps) {
  const outerStroke = 10;
  const innerStroke = 8;
  const gap = 12;
  const outerRadius = (size - outerStroke) / 2;
  const innerRadius = outerRadius - gap - innerStroke / 2;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const outerOffset = outerCircumference - (Math.min(outerPercentage, 100) / 100) * outerCircumference;
  const innerOffset = innerCircumference - (Math.min(innerPercentage, 100) / 100) * innerCircumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Outer track */}
        <circle cx={size / 2} cy={size / 2} r={outerRadius} fill="none" stroke="#1E1E1E" strokeWidth={outerStroke} />
        {/* Outer progress */}
        <circle
          cx={size / 2} cy={size / 2} r={outerRadius} fill="none"
          stroke={outerColor} strokeWidth={outerStroke} strokeLinecap="round"
          strokeDasharray={outerCircumference} strokeDashoffset={outerOffset}
          className="transition-all duration-700 ease-out"
        />
        {/* Inner track */}
        <circle cx={size / 2} cy={size / 2} r={innerRadius} fill="none" stroke="#1E1E1E" strokeWidth={innerStroke} />
        {/* Inner progress */}
        <circle
          cx={size / 2} cy={size / 2} r={innerRadius} fill="none"
          stroke={innerColor} strokeWidth={innerStroke} strokeLinecap="round"
          strokeDasharray={innerCircumference} strokeDashoffset={innerOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: outerColor }} />
          <span className="text-xs text-text-secondary">{outerLabel}: <span className="font-medium text-text-primary">{outerValue}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: innerColor }} />
          <span className="text-xs text-text-secondary">{innerLabel}: <span className="font-medium text-text-primary">{innerValue}</span></span>
        </div>
      </div>
    </div>
  );
}
