import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { fmtDollar, fmtMonthly, fmtPct } from '../../utils/format.js';

export default function BudgetTab({ projection, assumptions: a, onChange }) {
  const set = (key, val) => onChange({ ...a, [key]: val });

  const monthlyIncome = a.incomeMo;
  const monthlyBonus = a.bonusNet / 12;
  const totalMonthlyIncome = monthlyIncome + monthlyBonus;

  const expenseFields = [
    { key: 'mortgageHalfMo', name: 'Mortgage (half)',   color: '#ef4444', hint: 'half of $5,760 combined' },
    { key: 'billsHalfMo',    name: 'Bills (half)',       color: '#f97316', hint: 'half of $4,200 combined' },
    { key: 'spendingMo',     name: 'Personal Spending', color: '#facc15', hint: 'discretionary' },
    { key: 'datesMo',        name: 'Date Nights',       color: '#ec4899', hint: '/month' },
    { key: 'holidaysMo',     name: 'Holidays (half)',   color: '#a855f7', hint: 'half of $15k/yr' },
    { key: 'cashSavingsMo',  name: 'Offset Savings',    color: '#14b8a6', hint: 'to mortgage offset' },
  ];

  const totalMonthlyExpenses = expenseFields.reduce((s, e) => s + a[e.key], 0);
  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;
  const actualSurplus = (monthlyIncome - totalMonthlyExpenses) * 12 + a.bonusNet;

  const pieData = expenseFields.map(e => ({ name: e.name, amount: a[e.key], color: e.color }));

  const cashFlowData = projection
    .filter(p => p.age >= 36 && p.age <= a.retireAge + 2)
    .map(p => ({
      age: p.age,
      income: Math.round(p.annualIncome / 1000),
      expenses: Math.round(p.annualExpenses / 1000),
      surplus: p.shareContribution > 0 ? Math.round(p.shareContribution / 1000) : null,
      drawdown: p.drawdown > 0 ? Math.round(p.drawdown / 1000) : null,
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Editable budget table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Monthly Budget (Your Half)</h3>
            <span className="text-xs text-slate-500">Click any value to edit</span>
          </div>
          <div className="space-y-1">

            {/* Income rows */}
            <BudgetRow
              label="Monthly take-home (avg)"
              value={a.incomeMo}
              valueColor="text-green-400"
              onChange={v => set('incomeMo', v)}
              isIncome
            />
            <BudgetRow
              label="Annual bonus (net)"
              value={a.bonusNet}
              valueColor="text-green-400"
              onChange={v => set('bonusNet', v)}
              isAnnual
              isIncome
            />

            <div className="border-t border-slate-700 my-2" />

            {/* Expense rows */}
            {expenseFields.map(e => (
              <BudgetRow
                key={e.key}
                label={e.name}
                value={a[e.key]}
                dot={e.color}
                hint={e.hint}
                onChange={v => set(e.key, v)}
              />
            ))}

            <div className="border-t border-slate-600 my-2" />

            {/* Surplus */}
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-300 font-semibold text-sm">Monthly Surplus → Shares</span>
              <span className={`font-bold text-sm ${monthlySurplus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmtMonthly(monthlySurplus)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 text-xs">Annual to shares (incl. bonus)</span>
              <span className="text-blue-400 font-semibold text-sm">{fmtDollar(actualSurplus, 0)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 text-xs">Savings rate (excl. mortgage)</span>
              <span className="text-blue-400 font-semibold text-sm">
                {fmtPct(actualSurplus / (a.incomeMo * 12 + a.bonusNet))}
              </span>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="amount" nameKey="name">
                {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip
                formatter={(v, name) => [fmtMonthly(v), name]}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {expenseFields.map(e => (
              <div key={e.key} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <span className="text-slate-500 truncate">{e.name}</span>
                <span className="text-slate-400 ml-auto">{fmtMonthly(a[e.key])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Annual cash flows */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Annual Income vs Expenditure ($000s)</h3>
          <p className="text-xs text-slate-500">
            Income grows {fmtPct(a.incomeGrowth)}/yr · Expenses inflate {fmtPct(a.lifestyleGrowth)}/yr
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlowData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" tick={{ fill: '#94a3b8', fontSize: 10 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `$${v}k`} width={55} />
            <Tooltip
              formatter={(v, name) => [`$${v}k`, name]}
              labelFormatter={age => `Age ${age}`}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="income"   name="Income"            fill="#22c55e" fillOpacity={0.8} />
            <Bar dataKey="expenses" name="Expenses"          fill="#ef4444" fillOpacity={0.6} />
            <Bar dataKey="surplus"  name="Surplus → Shares"  fill="#3b82f6" fillOpacity={0.9} />
            <Bar dataKey="drawdown" name="Draw from Shares"  fill="#f97316" fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Phase cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhaseCard title="Full Time (36–44)" color="blue" items={[
          { label: 'Monthly income',  value: fmtMonthly(a.incomeMo) },
          { label: 'Annual bonus',    value: fmtDollar(a.bonusNet, 0) },
          { label: 'Yr 1 → shares',  value: fmtDollar(projection.find(p => p.age === 36)?.shareContribution, 0) },
          { label: 'Yr 1 super (SG)', value: fmtDollar(a.superEmployerY1, 0) },
        ]} />
        <PhaseCard title={`Part Time (${a.partTimeAge}–${a.retireAge - 1})`} color="orange" items={[
          { label: '50% income',      value: fmtMonthly(a.incomeMo * a.partTimeFraction) },
          { label: '50% bonus',       value: fmtDollar(a.bonusNet * a.partTimeFraction, 0) },
          { label: 'Draw from shares',value: `~${fmtDollar(projection.find(p => p.age === a.partTimeAge)?.drawdown, 0)}/yr` },
          { label: 'Super continues', value: '✓ Employer + Personal' },
        ]} />
        <PhaseCard title={`Retired (${a.retireAge}–59)`} color="red" items={[
          { label: 'No income',         value: '—' },
          { label: 'Annual drawdown',   value: fmtDollar(projection.find(p => p.age === a.retireAge + 1)?.drawdown, 0) },
          { label: 'Mortgage payoff (60)', value: fmtDollar(a.mortgageLumpSum, 0) },
          { label: 'Super still locked',value: 'Until age 60' },
        ]} />
      </div>
    </div>
  );
}

/** Inline-editable budget row */
function BudgetRow({ label, value, dot, hint, onChange, isAnnual = false, isIncome = false, valueColor = 'text-slate-300' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = isAnnual
    ? `$${Math.round(value).toLocaleString()}/yr`
    : fmtMonthly(value);

  const commit = () => {
    const num = parseFloat(draft.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0) onChange(num);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-slate-700/60 border border-blue-500/50">
        <span className="text-slate-300 text-sm">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-xs">$</span>
          <input
            autoFocus
            type="number"
            className="w-24 bg-transparent text-right text-sm font-semibold text-blue-300 outline-none"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
          />
          <span className="text-slate-500 text-xs">{isAnnual ? '/yr' : '/mo'}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-700/40 cursor-pointer group transition-colors"
      onClick={() => { setDraft(String(Math.round(value))); setEditing(true); }}
    >
      <div className="flex items-center gap-2">
        {dot && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />}
        <span className="text-slate-400 text-sm">{label}</span>
        {hint && <span className="text-slate-600 text-xs hidden group-hover:inline">· {hint}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-medium ${valueColor}`}>{displayValue}</span>
        <span className="text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
      </div>
    </div>
  );
}

function PhaseCard({ title, color, items }) {
  const borderColors = { blue: 'border-blue-500/30', orange: 'border-orange-500/30', red: 'border-red-500/30' };
  const titleColors  = { blue: 'text-blue-400',      orange: 'text-orange-400',      red: 'text-red-400' };
  return (
    <div className={`bg-slate-800 rounded-xl border ${borderColors[color]} p-4`}>
      <h4 className={`text-sm font-semibold mb-3 ${titleColors[color]}`}>{title}</h4>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex justify-between text-xs">
            <span className="text-slate-500">{item.label}</span>
            <span className="text-slate-300 font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
