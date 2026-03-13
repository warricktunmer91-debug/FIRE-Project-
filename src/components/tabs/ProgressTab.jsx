import React, { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import MetricCard from '../shared/MetricCard.jsx';
import { fmtDollar, fmtPct } from '../../utils/format.js';

const CURRENT_YEAR = 2026;

export default function ProgressTab({ projection, assumptions: a, actuals, onUpdateActuals }) {
  const [editAge, setEditAge] = useState(null);
  const [editShares, setEditShares] = useState('');
  const [editSuper, setEditSuper] = useState('');

  const checkpoints = [35, 40, 45, 50, 55, 60];

  const handleEdit = (age) => {
    const actual = actuals?.[age];
    setEditAge(age);
    setEditShares(actual?.shares ?? '');
    setEditSuper(actual?.super ?? '');
  };

  const handleSave = () => {
    if (editAge !== null) {
      onUpdateActuals({
        ...actuals,
        [editAge]: {
          shares: editShares !== '' ? Number(editShares) : undefined,
          super: editSuper !== '' ? Number(editSuper) : undefined,
        },
      });
      setEditAge(null);
    }
  };

  // Current age data point
  const currentProjected = projection?.find(p => p.age === a.currentAge);
  const actualCurrent = actuals?.[a.currentAge];

  // Shares delta
  const sharesDelta = actualCurrent?.shares !== undefined
    ? actualCurrent.shares - (currentProjected?.shares || a.sharesStart)
    : null;

  return (
    <div className="space-y-6">
      {/* Current status vs target */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Current Shares"
          value={fmtDollar(actuals?.[a.currentAge]?.shares || a.sharesStart)}
          sub={`Model baseline: ${fmtDollar(a.sharesStart)}`}
          badge="Now"
          badgeColor="blue"
          accent
        />
        <MetricCard
          label="Current Super"
          value={fmtDollar(actuals?.[a.currentAge]?.super || a.superStart)}
          sub={`Model baseline: ${fmtDollar(a.superStart)}`}
          badge="Now"
          badgeColor="purple"
        />
        <MetricCard
          label="Target @ Retire"
          value={fmtDollar(projection?.find(p => p.age === a.retireAge)?.shares)}
          sub={`Super: ${fmtDollar(projection?.find(p => p.age === a.retireAge)?.super)}`}
          badge={`Age ${a.retireAge}`}
          badgeColor="orange"
        />
        <MetricCard
          label="Years to Retire"
          value={`${a.retireAge - a.currentAge} yrs`}
          sub={`Part-time in ${a.partTimeAge - a.currentAge} yrs`}
          badge="Timeline"
          badgeColor="green"
        />
      </div>

      {/* Progress tracker table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Annual Review — Actual vs Projected</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click the edit icon to enter actual balances for annual review</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Age / Year</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Phase</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Proj Shares</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Actual Shares</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Proj Super</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Actual Super</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Variance</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Edit</th>
              </tr>
            </thead>
            <tbody>
              {checkpoints.map(age => {
                const proj = projection?.find(p => p.age === age);
                const actual = actuals?.[age];
                const year = CURRENT_YEAR + (age - a.currentAge);
                const phase = age < a.partTimeAge ? 'Full Time' : age < a.retireAge ? 'Part Time' : 'Retired';
                const phaseColor = age < a.partTimeAge ? 'text-blue-400' : age < a.retireAge ? 'text-orange-400' : 'text-red-400';
                const isPast = age <= a.currentAge;

                const variance = actual?.shares !== undefined && proj
                  ? actual.shares - proj.shares
                  : null;

                const isEditing = editAge === age;

                return (
                  <tr key={age} className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${isPast ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2 font-semibold text-slate-200">
                      Age {age}
                      <span className="ml-1 text-slate-500 font-normal">({year})</span>
                    </td>
                    <td className={`px-3 py-2 font-medium ${phaseColor}`}>{phase}</td>
                    <td className="px-3 py-2 text-blue-300">{proj ? fmtDollar(proj.shares) : '—'}</td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-28 px-2 py-1 text-xs bg-slate-700 border border-blue-500 rounded text-slate-200"
                          value={editShares}
                          onChange={e => setEditShares(e.target.value)}
                          placeholder="Enter amount"
                        />
                      ) : (
                        <span className={actual?.shares !== undefined ? 'text-blue-400 font-semibold' : 'text-slate-600'}>
                          {actual?.shares !== undefined ? fmtDollar(actual.shares) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-purple-300">{proj ? fmtDollar(proj.super) : '—'}</td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-28 px-2 py-1 text-xs bg-slate-700 border border-purple-500 rounded text-slate-200"
                          value={editSuper}
                          onChange={e => setEditSuper(e.target.value)}
                          placeholder="Enter amount"
                        />
                      ) : (
                        <span className={actual?.super !== undefined ? 'text-purple-400 font-semibold' : 'text-slate-600'}>
                          {actual?.super !== undefined ? fmtDollar(actual.super) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {variance !== null ? (
                        <span className={`font-semibold ${variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {variance >= 0 ? '+' : ''}{fmtDollar(variance)}
                          <span className="ml-1 text-slate-500 font-normal">
                            ({proj ? fmtPct(variance / proj.shares) : ''})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={handleSave} className="text-green-400 hover:text-green-300">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditAge(null)} className="text-slate-500 hover:text-slate-300">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(age)} className="text-slate-500 hover:text-blue-400 transition-colors">
                          <Edit3 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual review checklist */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Annual Review Checklist (July 1)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'Update share portfolio balance (current market value)',
            'Update super balance (from super fund statement)',
            'Check employer SG rate has been applied correctly',
            'Review salary — update incomeMo if changed',
            'Check bonus received — update bonusNet',
            'Review mortgage balance vs model',
            'Confirm personal super contributions lodged',
            'Review return rates vs actual fund performance',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <div className="w-4 h-4 rounded border border-slate-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-400">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
