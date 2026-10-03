import React from 'react';
import { AttendanceRating } from '../../types';

interface StatusBadgeProps {
  status: AttendanceRating | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';

  if (normalized.includes('excellent')) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    dot = 'bg-emerald-500';
  } else if (normalized.includes('good')) {
    bg = 'bg-sky-50 text-sky-700 border-sky-200/80';
    dot = 'bg-sky-500';
  } else if (normalized.includes('needs review') || normalized.includes('warning')) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200/80';
    dot = 'bg-amber-500';
  } else if (normalized.includes('review') || normalized.includes('critical') || normalized.includes('absent')) {
    bg = 'bg-rose-50 text-rose-700 border-rose-200/80';
    dot = 'bg-rose-500';
  } else if (normalized.includes('holiday')) {
    bg = 'bg-purple-50 text-purple-700 border-purple-200/80';
    dot = 'bg-purple-500';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClass} font-medium transition-colors`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      {status || '—'}
    </span>
  );
};

interface SessionBadgeProps {
  present: boolean | null | undefined;
  time?: string | null;
  isHoliday?: boolean;
  isWeekend?: boolean;
  label?: string;
  compact?: boolean;
}

export const SessionBadge: React.FC<SessionBadgeProps> = ({ present, time, isHoliday, isWeekend, label, compact = false }) => {
  if (present === true) {
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium border ${compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm`} title={`Present${time ? ` at ${time}` : ''}`}>
        <span className="font-bold text-emerald-700">✓</span>
        {time ? (
          <span className="font-mono text-[11px] font-semibold text-emerald-900 bg-emerald-100/80 px-1.5 py-0.5 rounded">
            {time}
          </span>
        ) : label ? (
          <span>{label}</span>
        ) : (
          <span>Present</span>
        )}
      </span>
    );
  }

  if (isHoliday) {
    return (
      <span className="inline-flex items-center justify-center font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-100/70 text-purple-700 border border-purple-200/50" title="Holiday">
        HOLIDAY
      </span>
    );
  }

  if (isWeekend) {
    return (
      <span className="inline-flex items-center justify-center font-mono text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200/60" title="Weekend">
        —
      </span>
    );
  }

  if (present === false) {
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium border ${compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} bg-rose-50 text-rose-700 border-rose-200 shadow-sm`} title="Absent">
        <span className="font-bold text-rose-600">✕</span>
        <span>Absent</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center font-mono text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200/50">
      —
    </span>
  );
};
