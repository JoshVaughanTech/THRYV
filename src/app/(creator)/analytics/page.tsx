import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Static analytics data (placeholder until real usage data is available)
const retentionData = [
  { week: 1, pct: 92 },
  { week: 2, pct: 88 },
  { week: 3, pct: 84 },
  { week: 4, pct: 79 },
  { week: 5, pct: 75 },
  { week: 6, pct: 71 },
  { week: 7, pct: 67 },
  { week: 8, pct: 64 },
  { week: 9, pct: 61 },
  { week: 10, pct: 58 },
  { week: 11, pct: 55 },
  { week: 12, pct: 52 },
];

const peakTimes = [
  { label: '6\u20138 AM', pct: 72, highlight: false },
  { label: '12\u20131 PM', pct: 45, highlight: false },
  { label: '5\u20137 PM', pct: 95, highlight: true },
  { label: '8\u201310 PM', pct: 60, highlight: false },
];

const topExercises = [
  { rank: 1, name: 'Barbell Back Squat', completions: 2847 },
  { rank: 2, name: 'Romanian Deadlift', completions: 2561 },
  { rank: 3, name: 'Bench Press', completions: 2234 },
  { rank: 4, name: 'Pull-Ups', completions: 1998 },
  { rank: 5, name: 'Hip Thrust', completions: 1876 },
];

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-onboarding');

  // Build SVG retention curve
  const svgW = 560;
  const svgH = 220;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const retentionPoints = retentionData.map((d, i) => {
    const x = padL + (i / (retentionData.length - 1)) * chartW;
    const y = padT + (1 - (d.pct - 40) / 60) * chartH; // scale 40-100%
    return { x, y, ...d };
  });

  const polyline = retentionPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Gradient fill area
  const areaPath = [
    `M ${retentionPoints[0].x},${retentionPoints[0].y}`,
    ...retentionPoints.slice(1).map((p) => `L ${p.x},${p.y}`),
    `L ${retentionPoints[retentionPoints.length - 1].x},${padT + chartH}`,
    `L ${retentionPoints[0].x},${padT + chartH}`,
    'Z',
  ].join(' ');

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-[#888888] mt-1">
          Deep dive into your program performance.
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* User Retention Curve */}
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
          <h2 className="text-lg font-bold text-white mb-1">
            User retention curve
          </h2>
          <p className="text-xs text-[#888888] mb-4">
            52% of users complete the full 12-week program
          </p>

          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient
                id="retentionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#B4F000" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#B4F000" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[100, 80, 60, 40].map((pct) => {
              const y = padT + (1 - (pct - 40) / 60) * chartH;
              return (
                <g key={pct}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgW - padR}
                    y2={y}
                    stroke="#1E1E1E"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#555555"
                    fontSize="10"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaPath} fill="url(#retentionGradient)" />

            {/* Line */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#B4F000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {retentionPoints.map((p) => (
              <circle
                key={p.week}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#0A0A0A"
                stroke="#B4F000"
                strokeWidth="2"
              />
            ))}

            {/* Week labels */}
            {retentionPoints.map((p) => (
              <text
                key={`label-${p.week}`}
                x={p.x}
                y={svgH - 4}
                textAnchor="middle"
                fill="#555555"
                fontSize="9"
              >
                W{p.week}
              </text>
            ))}
          </svg>
        </div>

        {/* Peak Training Times */}
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
          <h2 className="text-lg font-bold text-white mb-1">
            Peak training times
          </h2>
          <p className="text-xs text-[#888888] mb-6">
            Evening sessions (5&ndash;7 PM) are most popular
          </p>

          <div className="space-y-5">
            {peakTimes.map((slot) => (
              <div key={slot.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#CCCCCC]">{slot.label}</span>
                  <span
                    className={`text-sm font-bold ${
                      slot.highlight ? 'text-[#B4F000]' : 'text-white'
                    }`}
                  >
                    {slot.pct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1E1E1E] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      slot.highlight ? 'bg-[#B4F000]' : 'bg-[#7799DD]'
                    }`}
                    style={{ width: `${slot.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Completed Exercises */}
      <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
        <h2 className="text-lg font-bold text-white mb-6">
          Most completed exercises
        </h2>

        <div className="grid grid-cols-5 gap-4">
          {topExercises.map((ex) => (
            <div
              key={ex.rank}
              className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex flex-col items-center text-center"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${
                  ex.rank === 1
                    ? 'bg-[#B4F000] text-[#0A0A0A]'
                    : 'bg-[#1E1E1E] text-[#888888]'
                }`}
              >
                #{ex.rank}
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                {ex.name}
              </p>
              <p className="text-lg font-bold text-[#7ED957]">
                {ex.completions.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#555555]">completions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
