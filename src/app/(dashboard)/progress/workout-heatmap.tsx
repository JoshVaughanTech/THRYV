'use client';

interface WorkoutHeatmapProps {
  data: { date: string; count: number }[];
}

export function WorkoutHeatmap({ data }: WorkoutHeatmapProps) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // Group by week (columns) — 12 weeks of 7 days
  const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
  let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];

  for (const d of data) {
    const dayOfWeek = new Date(d.date).getDay();
    if (currentWeek.length > 0 && dayOfWeek === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ ...d, dayOfWeek });
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  function getCellColor(count: number): string {
    if (count === 0) return '#141414';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.33) return '#0A4A44';
    if (intensity <= 0.66) return '#0A7A70';
    return '#00E5CC';
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex gap-1">
      {/* Day labels */}
      <div className="flex flex-col gap-1 mr-1">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="h-3.5 flex items-center text-[9px] text-[#4a4a5a]"
          >
            {i % 2 === 1 ? label : ''}
          </div>
        ))}
      </div>

      {/* Grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {/* Pad missing days at start of first week */}
          {wi === 0 && week[0]?.dayOfWeek > 0 &&
            Array.from({ length: week[0].dayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} className="w-3.5 h-3.5 rounded-[3px]" />
            ))
          }
          {week.map((d) => (
            <div
              key={d.date}
              className="w-3.5 h-3.5 rounded-[3px] transition-colors"
              style={{ backgroundColor: getCellColor(d.count) }}
              title={`${d.date}: ${d.count} workout${d.count !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
