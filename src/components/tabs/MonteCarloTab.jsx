import React, { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import MetricCard from '../shared/MetricCard.jsx';
import { fmtDollar, fmtPct, yAxisFormatter, tooltipLabelFormatter } from '../../utils/format.js';

export default function MonteCarloTab({ mcResults, projection, assumptions: a }) {
  const [running, setRunning] = useState(false);

  if (!mcResults) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Running Monte Carlo simulation…</p>
      </div>
    );
  }

  const { percentileBands, successRate, failCount, numSims, probAbove2M_at50, probAbove3M_at50 } = mcResults;

  // Build fan chart data (stacked area bands + overlay lines)
  const baseByAge = {};
  if (projection) {
    projection.forEach(p => { baseByAge[p.age] = p.shares; });
  }

  const fanData = percentileBands
    .filter(d => d.age <= 80)
    .map(d => {
      const p10 = Math.max(0, d.p10);
      const p25 = Math.max(0, d.p25);
      const p50 = Math.max(0, d.p50);
      const p75 = Math.max(0, d.p75);
      const p90 = Math.max(0, d.p90);
      return {
        age: d.age,
        // Stacked areas
        invisible: p10,
        band_lo: p25 - p10,
        band_iqr: p75 - p25,
        band_hi: p90 - p75,
        // Overlay lines (absolute values)
        median: p50,
        base: baseByAge[d.age] || null,
      };
    });

  // Success rate gauge colour
  const srColor = successRate > 0.92 ? 'green' : successRate > 0.80 ? 'orange' : 'red';

  // Distribution at retire age
  const retireBands = percentileBands.find(d => d.age === a.retireAge);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Plan Success Rate"
          value={fmtPct(successRate)}
          sub={`${numSims - failCount} / ${numSims} simulations survive to age 60`}
          badge={successRate > 0.92 ? 'Very Safe' : successRate > 0.80 ? 'Acceptable' : 'At Risk'}
          badgeColor={srColor}
          accent
        />
        <MetricCard
          label="Median Shares @ Retire"
          value={fmtDollar(retireBands?.p50)}
          sub={`P25: ${fmtDollar(retireBands?.p25)} · P75: ${fmtDollar(retireBands?.p75)}`}
          badge={`Age ${a.retireAge}`}
          badgeColor="blue"
        />
        <MetricCard
          label="P(Shares > $2M @ retire)"
          value={fmtPct(probAbove2M_at50)}
          sub="Probability of reaching $2M at retirement"
          badgeColor="purple"
        />
        <MetricCard
          label="P(Shares > $3M @ retire)"
          value={fmtPct(probAbove3M_at50)}
          sub="Stretch target — $3M at retirement"
          badgeColor="orange"
        />
      </div>

      {/* Fan chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Monte Carlo Fan Chart — Share Portfolio</h3>
          <p className="text-xs text-slate-500">
            {numSims.toLocaleString()} simulations · Shares: μ={fmtPct(a.sharesReturn)} σ={fmtPct(a.sharesSD)} ·
            Super: μ={fmtPct(a.superReturn)} σ={fmtPct(a.superSD)}
          </p>
        </div>
        <div className="flex gap-4 mb-3 flex-wrap text-xs">
          <LegendItem color="#bfdbfe" label="10th–25th / 75th–90th percentile" />
          <LegendItem color="#60a5fa" label="25th–75th (IQR)" />
          <LegendItem color="#1d4ed8" label="Median (50th)" line />
          <LegendItem color="#f97316" label="Base case (deterministic)" line dashed />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={fanData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }} />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fill: '#94a3b8', fontSize: 11 }} width={65} />
            <Tooltip
              formatter={(value, name) => {
                if (['median', 'base'].includes(name)) return [fmtDollar(value), name === 'median' ? 'Median' : 'Base Case'];
                return [null, null]; // hide stacked band values
              }}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            />

            {/* Milestone reference lines */}
            <ReferenceLine x={a.partTimeAge} stroke="#f97316" strokeDasharray="4 3"
              label={{ value: 'PT', position: 'top', fill: '#f97316', fontSize: 10 }} />
            <ReferenceLine x={a.retireAge} stroke="#ef4444" strokeDasharray="4 3"
              label={{ value: 'Retire', position: 'top', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine x={60} stroke="#22c55e" strokeDasharray="4 3"
              label={{ value: 'Super', position: 'top', fill: '#22c55e', fontSize: 10 }} />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} strokeOpacity={0.5} />

            {/* Stacked percentile bands */}
            <Area type="monotone" dataKey="invisible" stackId="fan" stroke="none" fill="none" legendType="none" />
            <Area type="monotone" dataKey="band_lo"  stackId="fan" stroke="none" fill="#bfdbfe" fillOpacity={0.55} legendType="none" />
            <Area type="monotone" dataKey="band_iqr" stackId="fan" stroke="none" fill="#60a5fa" fillOpacity={0.45} legendType="none" />
            <Area type="monotone" dataKey="band_hi"  stackId="fan" stroke="none" fill="#bfdbfe" fillOpacity={0.55} legendType="none" />

            {/* Overlay lines */}
            <Line type="monotone" dataKey="median" stroke="#1d4ed8" strokeWidth={2.5} dot={false} name="median" legendType="none" />
            <Line type="monotone" dataKey="base" stroke="#f97316" strokeWidth={2} strokeDasharray="6 4" dot={false} name="base" legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Percentile table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Percentile Bands at Key Ages</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                {['Age', '10th %ile', '25th %ile', 'Median (50th)', '75th %ile', '90th %ile', 'Base Case'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[45, a.retireAge, 55, 60, 65, 70].map(age => {
                const d = percentileBands.find(b => b.age === age);
                const base = projection?.find(p => p.age === age);
                if (!d) return null;
                return (
                  <tr key={age} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2 font-semibold text-slate-200">
                      {age}
                      {age === a.retireAge && <span className="ml-1 text-red-400">★</span>}
                    </td>
                    <td className="px-3 py-2 text-red-400">{fmtDollar(d.p10)}</td>
                    <td className="px-3 py-2 text-orange-400">{fmtDollar(d.p25)}</td>
                    <td className="px-3 py-2 text-blue-300 font-semibold">{fmtDollar(d.p50)}</td>
                    <td className="px-3 py-2 text-green-400">{fmtDollar(d.p75)}</td>
                    <td className="px-3 py-2 text-green-300">{fmtDollar(d.p90)}</td>
                    <td className="px-3 py-2 text-orange-300">{base ? fmtDollar(base.shares) : '—'}</td>
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

function LegendItem({ color, label, line, dashed }) {
  return (
    <div className="flex items-center gap-2">
      {line ? (
        <svg width="24" height="10">
          <line x1="0" y1="5" x2="24" y2="5" stroke={color} strokeWidth="2"
            strokeDasharray={dashed ? '5 3' : undefined} />
        </svg>
      ) : (
        <div className="w-6 h-3 rounded" style={{ background: color, opacity: 0.8 }} />
      )}
      <span className="text-slate-400">{label}</span>
    </div>
  );
}
