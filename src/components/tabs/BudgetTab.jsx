import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { fmtDollar, fmtMonthly, fmtPct, yAxisFormatter } from '../../utils/format.js';

const PIE_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#facc15', '#ec4899', '#14b8a6'];

export default function BudgetTab({ projection, assumptions: a }) {
  if (!projection || projection.length === 0) return null;

  // Current year budget (full-time)
  const monthlyIncome = a.incomeMo;
  const monthlyBonus = a.bonusNet / 12;
  const totalMonthlyIncome = monthlyIncome + monthlyBonus;

  const expenses = [
    { name: 'Mortgage (half)', amount: a.mortgageHalfMo, color: '#ef4444' },
    { name: 'Bills (half)', amount: a.billsHalfMo, color: '#f97316' },
    { name: 'Personal Spending', amount: a.spendingMo, color: '#facc15' },
    { name: 'Date Nights', amount: a.datesMo, color: '#ec4899' },
    { name: 'Holidays (half)', amount: a.holidaysMo, color: '#a855f7' },
    { name: 'Offset Savings', amount: a.cashSavingsMo, color: '#14b8a6' },
  ];

  const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;
  const annualSurplus = monthlySurplus * 12 + 0; // bonus already included via monthlyBonus
  const actualSurplus = (monthlyIncome - totalMonthlyExpenses) * 12 + a.bonusNet;

  // Annual cash flow across working life
  const cashFlowData = projection
    .filter(p => p.age >= 36 && p.age <= a.retireAge + 2)
    .map(p => ({
      age: p.age,
      income: Math.round(p.annualIncome / 1000),
      expenses: Math.round(p.annualExpenses / 1000),
      surplus: p.shareContribution > 0 ? Math.round(p.shareContribution / 1000) : null,
      drawdown: p.drawdown > 0 ? Math.round(p.drawdown / 1000) : null,
    }));

  // Super breakdown in year 1
  const superItems = [
    { name: 'Employer SG (yr 1)', amount: a.superEmployerY1 / 12, color: '#a855f7' },
    { name: 'Personal (from age 41)', amount: a.superPersonal / 12, color: '#60a5fa' },
  ];

  return (
    <div className="space-y-6">
      {/* Monthly budget breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Monthly Budget (Your Half)</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">Monthly take-home (avg)</span>
              <span className="text-green-400 font-semibold">{fmtMonthly(monthlyIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">Monthly bonus equivalent</span>
              <span className="text-green-400 font-semibold">{fmtMonthly(monthlyBonus)}</span>
            </div>
            {expenses.map(e => (
              <div key={e.name} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                  <span className="text-slate-400 text-sm">{e.name}</span>
                </div>
                <span className="text-slate-300">{fmtMonthly(e.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 border-t border-slate-600 mt-2">
              <span className="text-slate-300 font-semibold text-sm">Monthly Surplus → Shares</span>
              <span className={`font-bold ${monthlySurplus > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                {fmtPct(actualSurplus / ((a.incomeMo * 12) + a.bonusNet))}
              </span>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={expenses}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="amount"
                nameKey="name"
              >
                {expenses.map((e, i) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [fmtMonthly(v), name]}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {expenses.map(e => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <span className="text-slate-500 truncate">{e.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Annual cash flows chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Annual Income vs Expenditure ($000s)</h3>
          <p className="text-xs text-slate-500">Includes income growth at {fmtPct(a.incomeGrowth)} · Expenses inflate at {fmtPct(a.lifestyleGrowth)}</p>
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
            <Bar dataKey="income" name="Income" fill="#22c55e" fillOpacity={0.8} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" fillOpacity={0.6} />
            <Bar dataKey="surplus" name="Surplus → Shares" fill="#3b82f6" fillOpacity={0.9} />
            <Bar dataKey="drawdown" name="Draw from Shares" fill="#f97316" fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Phase summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhaseCard
          title="Full Time (36–44)"
          color="blue"
          items={[
            { label: 'Monthly income', value: fmtMonthly(a.incomeMo) },
            { label: 'Annual bonus', value: fmtDollar(a.bonusNet, 0) },
            { label: 'Yr 1 → shares', value: fmtDollar(projection.find(p => p.age === 36)?.shareContribution, 0) },
            { label: 'Yr 1 super (SG)', value: fmtDollar(a.superEmployerY1, 0) },
          ]}
        />
        <PhaseCard
          title={`Part Time (${a.partTimeAge}–${a.retireAge - 1})`}
          color="orange"
          items={[
            { label: '50% income', value: fmtMonthly(a.incomeMo * a.partTimeFraction) },
            { label: '50% bonus', value: fmtDollar(a.bonusNet * a.partTimeFraction, 0) },
            { label: 'Draw from shares', value: `~${fmtDollar(projection.find(p => p.age === a.partTimeAge)?.drawdown, 0)}/yr` },
            { label: 'Super continues', value: '✓ Employer + Personal' },
          ]}
        />
        <PhaseCard
          title={`Retired (${a.retireAge}–59)`}
          color="red"
          items={[
            { label: 'No income', value: '—' },
            { label: 'Annual drawdown', value: fmtDollar(projection.find(p => p.age === a.retireAge + 1)?.drawdown, 0) },
            { label: 'Mortgage payoff (60)', value: fmtDollar(a.mortgageLumpSum, 0) },
            { label: 'Super still locked', value: 'Until age 60' },
          ]}
        />
      </div>
    </div>
  );
}

function PhaseCard({ title, color, items }) {
  const borderColors = { blue: 'border-blue-500/30', orange: 'border-orange-500/30', red: 'border-red-500/30' };
  const titleColors = { blue: 'text-blue-400', orange: 'text-orange-400', red: 'text-red-400' };
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
