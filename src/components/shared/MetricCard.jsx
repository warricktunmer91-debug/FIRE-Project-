import React from 'react';

/**
 * Stat card with value, label and optional sublabel/badge.
 */
export default function MetricCard({ label, value, sub, badge, badgeColor = 'blue', accent = false }) {
  const badgeColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-blue-400' : 'text-slate-100'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {badge && (
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
