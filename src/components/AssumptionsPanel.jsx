import React, { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import SliderInput from './shared/SliderInput.jsx';
import { fmtDollar, fmtPct, fmtMonthly } from '../utils/format.js';
import { DEFAULT_ASSUMPTIONS } from '../data/assumptions.js';

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-300 transition-colors"
      >
        {title}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

export default function AssumptionsPanel({ assumptions: a, onChange, onReset }) {
  const set = (key, val) => onChange({ ...a, [key]: val });

  return (
    <aside className="w-72 min-w-[18rem] bg-slate-900 border-r border-slate-700/50 h-full overflow-y-auto flex-shrink-0 no-print">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">Assumptions</h2>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>

        <Section title="Income">
          <SliderInput
            label="Monthly take-home (avg)"
            value={Math.round(a.incomeMo)}
            min={5000}
            max={18000}
            step={100}
            format={(v) => fmtMonthly(v)}
            onChange={(v) => set('incomeMo', v)}
            hint="4mo @ $8,500 + 8mo @ $9,500 (default)"
          />
          <SliderInput
            label="Annual bonus (net of tax)"
            value={a.bonusNet}
            min={0}
            max={50000}
            step={1000}
            format={(v) => fmtDollar(v, 0)}
            onChange={(v) => set('bonusNet', v)}
          />
          <SliderInput
            label="Income growth rate"
            value={Math.round(a.incomeGrowth * 100)}
            min={0}
            max={8}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => set('incomeGrowth', v / 100)}
          />
        </Section>

        <Section title="Returns">
          <SliderInput
            label="Share portfolio return"
            value={Math.round(a.sharesReturn * 100)}
            min={4}
            max={15}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => set('sharesReturn', v / 100)}
          />
          <SliderInput
            label="Shares volatility (SD)"
            value={Math.round(a.sharesSD * 100)}
            min={5}
            max={30}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => set('sharesSD', v / 100)}
          />
          <SliderInput
            label="Super return"
            value={Math.round(a.superReturn * 100)}
            min={3}
            max={12}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => set('superReturn', v / 100)}
          />
          <SliderInput
            label="Super volatility (SD)"
            value={Math.round(a.superSD * 100)}
            min={3}
            max={15}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => set('superSD', v / 100)}
          />
        </Section>

        <Section title="Milestones">
          <SliderInput
            label="Part-time starts (age)"
            value={a.partTimeAge}
            min={40}
            max={50}
            step={1}
            format={(v) => `Age ${v}`}
            onChange={(v) => set('partTimeAge', Math.min(v, a.retireAge - 1))}
          />
          <SliderInput
            label="Full retirement (age)"
            value={a.retireAge}
            min={45}
            max={58}
            step={1}
            format={(v) => `Age ${v}`}
            onChange={(v) => set('retireAge', Math.max(v, a.partTimeAge + 1))}
          />
        </Section>

        <Section title="Starting Balances" defaultOpen={false}>
          <SliderInput
            label="Share portfolio"
            value={a.sharesStart}
            min={50000}
            max={1000000}
            step={5000}
            format={(v) => fmtDollar(v, 0)}
            onChange={(v) => set('sharesStart', v)}
          />
          <SliderInput
            label="Superannuation"
            value={a.superStart}
            min={20000}
            max={500000}
            step={5000}
            format={(v) => fmtDollar(v, 0)}
            onChange={(v) => set('superStart', v)}
          />
        </Section>

        <Section title="Monthly Expenses" defaultOpen={false}>
          <SliderInput
            label="Mortgage (your half)"
            value={a.mortgageHalfMo}
            min={1000}
            max={6000}
            step={100}
            format={(v) => fmtMonthly(v)}
            onChange={(v) => set('mortgageHalfMo', v)}
          />
          <SliderInput
            label="Bills (your half)"
            value={a.billsHalfMo}
            min={500}
            max={5000}
            step={100}
            format={(v) => fmtMonthly(v)}
            onChange={(v) => set('billsHalfMo', v)}
          />
          <SliderInput
            label="Personal spending"
            value={a.spendingMo}
            min={200}
            max={3000}
            step={50}
            format={(v) => fmtMonthly(v)}
            onChange={(v) => set('spendingMo', v)}
          />
          <SliderInput
            label="Holidays (your half)"
            value={a.holidaysMo}
            min={0}
            max={2000}
            step={50}
            format={(v) => fmtMonthly(v)}
            onChange={(v) => set('holidaysMo', v)}
          />
        </Section>

        <Section title="Super Contributions" defaultOpen={false}>
          <SliderInput
            label="Employer SG (yr 2+)"
            value={a.superEmployerY2}
            min={10000}
            max={40000}
            step={500}
            format={(v) => fmtDollar(v, 0)}
            onChange={(v) => set('superEmployerY2', v)}
          />
          <SliderInput
            label="Personal contribution (yr 6+)"
            value={a.superPersonal}
            min={0}
            max={30000}
            step={500}
            format={(v) => fmtDollar(v, 0)}
            onChange={(v) => set('superPersonal', v)}
          />
        </Section>

        {/* Snapshot of current key values */}
        <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs space-y-1.5">
          <p className="font-semibold text-slate-300 mb-2">Current snapshot</p>
          <Row k="Annual take-home" v={fmtDollar(a.incomeMo * 12 + a.bonusNet, 0)} />
          <Row k="Monthly fixed costs" v={fmtMonthly(a.mortgageHalfMo + a.billsHalfMo + a.spendingMo + a.datesMo + a.holidaysMo)} />
          <Row k="Starting shares" v={fmtDollar(a.sharesStart, 0)} />
          <Row k="Starting super" v={fmtDollar(a.superStart, 0)} />
        </div>
      </div>
    </aside>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-300 font-medium">{v}</span>
    </div>
  );
}
