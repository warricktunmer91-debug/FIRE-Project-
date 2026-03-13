import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import MetricCard from '../shared/MetricCard.jsx';
import { fmtDollar, fmtPct, yAxisFormatter, tooltipLabelFormatter } from '../../utils/format.js';

const SCENARIO_LINES = [
  { key: 'base',       label: 'Base Case',             color: '#22c55e', dash: false },
  { key: 'crashY1_30', label: '–30% Crash (Age 50)',   color: '#f97316', dash: false },
  { key: 'crashY3_30', label: '–30% Crash (Age 52)',   color: '#facc15', dash: '6 3' },
  { key: 'crashY1_50', label: '–50% Crash (Age 50)',   color: '#ef4444', dash: false },
];

const STATIC_COLORS = {
  base: '#22c55e', ret7: '#ef4444', bonus10k: '#60a5fa',
  retire52: '#a855f7', ret7b10k: '#f97316', ret7r52: '#facc15', worst: '#f43f5e',
};

export default function StressTestTab({ sequenceCrashes, staticScenarios, assumptions: a }) {
  const [view, setView] = useState('sequence'); // 'sequence' | 'static'

  if (!sequenceCrashes || !staticScenarios) {
    return <div className="flex items-center justify-center h-64"><p className="text-slate-500">Computing…</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-2">
        {[
          { id: 'sequence', label: 'Phase 3: Sequence of Returns' },
          { id: 'static', label: 'Spreadsheet Scenarios' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'sequence' ? (
        <SequenceCrashView crashes={sequenceCrashes} assumptions={a} />
      ) : (
        <StaticScenariosView scenarios={staticScenarios} assumptions={a} />
      )}
    </div>
  );
}

function SequenceCrashView({ crashes, assumptions: a }) {
  // Build combined chart data indexed by age
  const ages = crashes.base.filter(p => p.age >= a.retireAge - 2 && p.age <= 75).map(p => p.age);

  const chartData = ages.map(age => {
    const row = { age };
    for (const s of SCENARIO_LINES) {
      const proj = crashes[s.key];
      const point = proj?.find(p => p.age === age);
      row[s.key] = point?.shares !== undefined ? Math.max(point.shares, 0) : null;
    }
    return row;
  });

  // Survival check: does each scenario survive to age 60?
  const survivalCheck = SCENARIO_LINES.slice(1).map(s => {
    const proj = crashes[s.key];
    const retireToSuper = proj?.filter(p => p.age >= a.retireAge && p.age <= 60) || [];
    const minRaw = Math.min(...retireToSuper.map(p => (p.sharesRaw !== undefined ? p.sharesRaw : p.shares)));
    return { ...s, survives: minRaw >= 0, minShares: minRaw };
  });

  return (
    <div className="space-y-4">
      {/* Survival summary */}
      <div className="grid grid-cols-3 gap-4">
        {survivalCheck.map(s => (
          <MetricCard
            key={s.key}
            label={s.label}
            value={s.survives ? '✓ Survives' : '✗ Fails'}
            sub={`Min balance: ${fmtDollar(s.minShares)} before age 60`}
            badge={s.survives ? 'Plan OK' : 'Plan Fails'}
            badgeColor={s.survives ? 'green' : 'red'}
          />
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Sequence of Returns Risk</h3>
          <p className="text-xs text-slate-500">
            Market crash scenarios applied at start of retirement — share portfolio only
          </p>
        </div>
        <div className="flex gap-5 mb-3 flex-wrap text-xs">
          {SCENARIO_LINES.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <svg width="22" height="10">
                <line x1="0" y1="5" x2="22" y2="5" stroke={s.color} strokeWidth="2"
                  strokeDasharray={s.dash || undefined} />
              </svg>
              <span className="text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }} />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fill: '#94a3b8', fontSize: 11 }} width={65} />
            <Tooltip
              formatter={(v, name) => {
                const s = SCENARIO_LINES.find(x => x.key === name);
                return [fmtDollar(v), s?.label || name];
              }}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="2 2" />
            <ReferenceLine x={a.retireAge} stroke="#ef4444" strokeDasharray="4 3"
              label={{ value: 'Retire', position: 'top', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine x={60} stroke="#22c55e" strokeDasharray="4 3"
              label={{ value: 'Super', position: 'top', fill: '#22c55e', fontSize: 10 }} />
            {SCENARIO_LINES.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dash || undefined}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Crash impact detail */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Post-Crash Share Balance at Key Ages</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Age</th>
                {SCENARIO_LINES.map(s => (
                  <th key={s.key} className="px-3 py-2 text-left text-slate-400 font-medium">
                    <span style={{ color: s.color }}>{s.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[a.retireAge, a.retireAge + 1, a.retireAge + 3, 55, 60, 65].map(age => (
                <tr key={age} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-3 py-2 font-semibold text-slate-200">{age}</td>
                  {SCENARIO_LINES.map(s => {
                    const proj = crashes[s.key];
                    const pt = proj?.find(p => p.age === age);
                    const raw = pt?.sharesRaw !== undefined ? pt.sharesRaw : pt?.shares;
                    const isFailed = raw < 0;
                    return (
                      <td key={s.key} className={`px-3 py-2 ${isFailed ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                        {pt ? fmtDollar(raw) : '—'}
                        {isFailed && ' ⚠'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StaticScenariosView({ scenarios, assumptions: a }) {
  const retireYear = a.retireAge - a.currentAge;
  // Chart data from retirement onwards
  const ages = scenarios[0].projection
    .filter(p => p.age >= 45 && p.age <= 70)
    .map(p => p.age);

  const chartData = ages.map(age => {
    const row = { age };
    scenarios.forEach(s => {
      const pt = s.projection.find(p => p.age === age);
      row[s.id] = pt ? Math.max(pt.shares, 0) : null;
    });
    return row;
  });

  return (
    <div className="space-y-4">
      {/* Scenario summary table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Scenario Comparison (matches Stress Tests sheet)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                {['Scenario', 'Ret Age', 'Return', 'Bonus', 'Shares@45', 'Shares@Retire', 'W/R%', 'Min Shares', 'Combined@60', 'Result'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.id} className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${!s.passes ? 'bg-red-500/5' : ''}`}>
                  <td className="px-3 py-2 font-medium" style={{ color: STATIC_COLORS[s.id] || '#94a3b8' }}>
                    {s.label}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.retireAge}</td>
                  <td className="px-3 py-2 text-slate-300">{fmtPct(s.sharesReturn)}</td>
                  <td className="px-3 py-2 text-slate-300">{fmtDollar(s.bonus, 0)}</td>
                  <td className="px-3 py-2 text-blue-300">{fmtDollar(s.at45Shares)}</td>
                  <td className="px-3 py-2 text-blue-300">{fmtDollar(s.atRetireShares)}</td>
                  <td className={`px-3 py-2 font-semibold ${s.withdrawalRate < 0.05 ? 'text-green-400' : s.withdrawalRate < 0.07 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fmtPct(s.withdrawalRate)}
                  </td>
                  <td className={`px-3 py-2 font-semibold ${s.minShares < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {fmtDollar(s.minShares)}
                  </td>
                  <td className="px-3 py-2 text-green-300">{fmtDollar(s.combined60)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.passes ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {s.passes ? '✅ OK' : '❌ FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Share Portfolio by Scenario</h3>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fill: '#94a3b8', fontSize: 11 }} width={65} />
            <Tooltip
              formatter={(v, name) => {
                const s = scenarios.find(x => x.id === name);
                return [fmtDollar(v), s?.label || name];
              }}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} />
            {scenarios.map(s => (
              <Line key={s.id} type="monotone" dataKey={s.id}
                stroke={STATIC_COLORS[s.id] || '#94a3b8'} strokeWidth={2}
                dot={false} name={s.id} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
