import React from 'react';
import { TrendingUp, Target, Shield } from 'lucide-react';
import { fmtDollar, fmtPct } from '../utils/format.js';

export default function Header({ projection, mcSuccessRate }) {
  const at50 = projection?.find(p => p.age === 50);
  const at60 = projection?.find(p => p.age === 60);

  const combined50 = at50 ? at50.shares + at50.super : 0;
  const combined60 = at60 ? at60.shares + at60.super : 0;

  return (
    <header className="bg-slate-900 border-b border-slate-700/50 px-6 py-4 no-print">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-100">FIRE Planner</h1>
            <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded-full">
              Warrick Tunmer · FMG Perth
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-10">
            Part-time 45 · Retire 50 · Super 60
          </p>
        </div>

        {/* Key stats strip */}
        <div className="flex items-center gap-6 flex-wrap">
          <StatChip
            icon={<Shield size={14} />}
            label="MC Success Rate"
            value={mcSuccessRate !== null ? fmtPct(mcSuccessRate) : '…'}
            color={mcSuccessRate > 0.90 ? 'green' : mcSuccessRate > 0.80 ? 'orange' : 'red'}
          />
          <StatChip
            icon={<Target size={14} />}
            label="Combined @ 50"
            value={fmtDollar(combined50)}
            color="blue"
          />
          <StatChip
            icon={<TrendingUp size={14} />}
            label="Combined @ 60"
            value={fmtDollar(combined60)}
            color="purple"
          />
        </div>
      </div>
    </header>
  );
}

function StatChip({ icon, label, value, color }) {
  const colors = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${colors[color]}`}>
      {icon}
      <div>
        <span className="text-slate-500 text-xs">{label}: </span>
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}
