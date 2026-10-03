import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full animate-pulse space-y-3 p-4 bg-white rounded-xl border border-slate-200">
      <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2 border-b border-slate-100">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-slate-100 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-72' }) => {
  return (
    <div className={`w-full ${height} animate-pulse bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between`}>
      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
      <div className="flex items-end gap-3 h-48 pt-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-100 rounded-t flex-1"
            style={{ height: `${Math.max(20, Math.sin(i) * 80 + 20)}%` }}
          ></div>
        ))}
      </div>
      <div className="h-4 bg-slate-100 rounded w-full mt-2"></div>
    </div>
  );
};
