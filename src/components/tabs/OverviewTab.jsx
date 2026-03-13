import React from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import MetricCard from '../shared/MetricCard.jsx';
import { fmtDollar, fmtPct, yAxisFormatter, tooltipFormatter, tooltipLabelFormatter } from '../../utils/format.js';
import { SPREADSHEET_MILESTONES } from '../../data/assumptions.js';

const MILESTONE_COLOR = {
  parttime: '#f97316',
  retire: '#ef4444',
  super: '#22c55e',
};

export default function OverviewTab({ projection, assumptions: a }) {
  if (!projection || projection.length === 0) return null;

  const at45 = projection.find(p => p.age === 45);
  const atRetire = projection.find(p => p.age === a.retireAge);
  const at60 = projection.find(p => p.age === 60);

  // Spreadsheet verification (compare to known outputs)
  const diff45 = at45 ? Math.abs(at45.shares - SPREADSHEET_MILESTONES.age45.shares) / SPREADSHEET_MILESTONES.age45.shares : null;
  const modelMatches = diff45 !== null && diff45 < 0.03; // within 3%

  // Chart data — only show up to age 75 for clarity
  const chartData = projection
    .filter(p => p.age <= 75)
    .map(p => ({
      age: p.age,
      shares: p.shares,
      super: p.super,
      netWorth: p.shares + p.super,
    }));

  const retireYear = a.retireAge;
  const partTimeYear = a.partTimeAge;

  return (
    <div className="space-y-6">
      {/* Key Milestone Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Part-Time Starts (45)"
          value={fmtDollar(at45?.shares)}
          sub={`Super: ${fmtDollar(at45?.super)} · Combined: ${fmtDollar(at45 ? at45.shares + at45.super : 0)}`}
          badge="Age 45"
          badgeColor="orange"
        />
        <MetricCard
          label={`Retire (${a.retireAge})`}
          value={fmtDollar(atRetire?.shares)}
          sub={`Super: ${fmtDollar(atRetire?.super)} · Combined: ${fmtDollar(atRetire ? atRetire.shares + atRetire.super : 0)}`}
          badge={`Age ${a.retireAge}`}
          badgeColor="red"
          accent
        />
        <MetricCard
          label="Super Unlocks (60)"
          value={fmtDollar(at60?.shares)}
          sub={`Super: ${fmtDollar(at60?.super)} · Combined: ${fmtDollar(at60 ? at60.shares + at60.super : 0)}`}
          badge="Age 60"
          badgeColor="green"
        />
        <MetricCard
          label="Drawdown @ Retire"
          value={fmtDollar(projection.find(p => p.age === a.retireAge + 1)?.drawdown)}
          sub={`W/R: ${fmtPct(atRetire ? (projection.find(p => p.age === a.retireAge + 1)?.drawdown || 0) / atRetire.shares : 0)}`}
          badge={
            atRetire && (projection.find(p => p.age === a.retireAge + 1)?.drawdown || 0) / atRetire.shares < 0.05
              ? 'Very Safe'
              : 'Acceptable'
          }
          badgeColor={
            atRetire && (projection.find(p => p.age === a.retireAge + 1)?.drawdown || 0) / atRetire.shares < 0.05
              ? 'green' : 'orange'
          }
        />
      </div>

      {/* Portfolio trajectory chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Portfolio Trajectory — Base Case</h3>
            <p className="text-xs text-slate-500">10% shares, 8% super · Nominal AUD</p>
          </div>
          {modelMatches && (
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              ✓ Matches spreadsheet ±3%
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="age"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fill: '#94a3b8', fontSize: 11 }} width={65} />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />

            {/* Phase background bands */}
            <Area type="monotone" dataKey="netWorth" stroke="none" fill="#22c55e" fillOpacity={0.04} legendType="none" />

            {/* Milestone reference lines */}
            <ReferenceLine x={partTimeYear} stroke={MILESTONE_COLOR.parttime} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'Part-Time', position: 'top', fill: MILESTONE_COLOR.parttime, fontSize: 10, dy: -4 }} />
            <ReferenceLine x={retireYear} stroke={MILESTONE_COLOR.retire} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'Retire', position: 'top', fill: MILESTONE_COLOR.retire, fontSize: 10, dy: -4 }} />
            <ReferenceLine x={60} stroke={MILESTONE_COLOR.super} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'Super', position: 'top', fill: MILESTONE_COLOR.super, fontSize: 10, dy: -4 }} />

            <Line type="monotone" dataKey="shares" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Share Portfolio" />
            <Line type="monotone" dataKey="super" stroke="#a855f7" strokeWidth={2.5} dot={false} name="Superannuation" />
            <Line type="monotone" dataKey="netWorth" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Combined" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Annual schedule table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Annual Schedule — Key Years</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                {['Age', 'Phase', 'Shares', 'Super', 'Combined', 'Income', 'Annual Cost', 'Contribution / Draw'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projection
                .filter(p => p.age >= 36 && p.age <= 75 && (p.age % 5 === 0 || p.age === a.retireAge || p.age === a.partTimeAge || p.age === 60 || p.age === 36))
                .map(p => {
                  const isRetire = p.age === a.retireAge;
                  const isPT = p.age === a.partTimeAge;
                  const isSuper = p.age === 60;
                  const highlight = isRetire ? 'bg-red-500/5' : isPT ? 'bg-orange-500/5' : isSuper ? 'bg-green-500/5' : '';
                  return (
                    <tr key={p.age} className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${highlight}`}>
                      <td className="px-3 py-2 font-semibold text-slate-200">
                        {p.age}
                        {isRetire && <span className="ml-1 text-red-400">★</span>}
                        {isPT && <span className="ml-1 text-orange-400">◎</span>}
                        {isSuper && <span className="ml-1 text-green-400">◎</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          p.phase === 'fulltime' ? 'bg-blue-500/20 text-blue-400' :
                          p.phase === 'parttime' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {p.phase === 'fulltime' ? 'Full Time' : p.phase === 'parttime' ? 'Part Time' : 'Retired'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-blue-300">{fmtDollar(p.shares)}</td>
                      <td className="px-3 py-2 text-purple-300">{fmtDollar(p.super)}</td>
                      <td className="px-3 py-2 text-green-300 font-medium">{fmtDollar(p.shares + p.super)}</td>
                      <td className="px-3 py-2 text-slate-300">{p.annualIncome > 0 ? fmtDollar(p.annualIncome) : '—'}</td>
                      <td className="px-3 py-2 text-slate-400">{fmtDollar(p.annualExpenses)}</td>
                      <td className="px-3 py-2">
                        {p.shareContribution > 0 ? (
                          <span className="text-green-400">+{fmtDollar(p.shareContribution)}</span>
                        ) : p.drawdown > 0 ? (
                          <span className="text-red-400">-{fmtDollar(p.drawdown)}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
