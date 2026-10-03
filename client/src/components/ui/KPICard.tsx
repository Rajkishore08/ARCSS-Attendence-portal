import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  accentBorder?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-sky-600 bg-sky-50',
  trend,
  onClick,
  accentBorder = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border transition-all duration-200 ${
        accentBorder ? 'border-sky-300 shadow-md ring-1 ring-sky-100' : 'border-slate-200/80 shadow-card hover:shadow-md'
      } ${onClick ? 'cursor-pointer hover:border-sky-400' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</span>
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-sans">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 line-clamp-1">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
