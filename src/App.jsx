import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Printer, BarChart2, TrendingUp, Zap, DollarSign, Target } from 'lucide-react';

import { DEFAULT_ASSUMPTIONS } from './data/assumptions.js';
import { runProjection } from './utils/projection.js';
import { runMonteCarlo } from './utils/monteCarlo.js';
import { runSequenceCrashTests, runStaticScenarios } from './utils/stressTests.js';

import Header from './components/Header.jsx';
import AssumptionsPanel from './components/AssumptionsPanel.jsx';
import OverviewTab from './components/tabs/OverviewTab.jsx';
import MonteCarloTab from './components/tabs/MonteCarloTab.jsx';
import StressTestTab from './components/tabs/StressTestTab.jsx';
import BudgetTab from './components/tabs/BudgetTab.jsx';
import ProgressTab from './components/tabs/ProgressTab.jsx';

const TABS = [
  { id: 'overview',    label: 'Overview',     icon: TrendingUp },
  { id: 'montecarlo',  label: 'Monte Carlo',  icon: BarChart2 },
  { id: 'stress',      label: 'Stress Tests', icon: Zap },
  { id: 'budget',      label: 'Budget',       icon: DollarSign },
  { id: 'progress',    label: 'Progress',     icon: Target },
];

export default function App() {
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [actuals, setActuals] = useState({
    35: { shares: DEFAULT_ASSUMPTIONS.sharesStart, super: DEFAULT_ASSUMPTIONS.superStart },
  });
  const printRef = useRef(null);

  // ── Memoised computations ──────────────────────────────────────────────────
  const projection = useMemo(() => runProjection(assumptions), [assumptions]);

  const mcResults = useMemo(() => {
    // Monte Carlo is expensive (5000 sims) — runs on every assumption change
    return runMonteCarlo(assumptions, 5000);
  }, [assumptions]);

  const sequenceCrashes = useMemo(() => runSequenceCrashTests(assumptions), [assumptions]);
  const staticScenarios = useMemo(() => runStaticScenarios(assumptions), [assumptions]);

  const handleReset = useCallback(() => {
    setAssumptions(DEFAULT_ASSUMPTIONS);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" ref={printRef}>
      {/* ── Header ── */}
      <Header projection={projection} mcSuccessRate={mcResults?.successRate ?? null} />

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 72px)' }}>
        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <AssumptionsPanel
            assumptions={assumptions}
            onChange={setAssumptions}
            onReset={handleReset}
          />
        )}

        {/* ── Content area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="bg-slate-900 border-b border-slate-700/50 px-4 py-0 flex items-center gap-1 no-print overflow-x-auto">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-2 text-slate-500 hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-800"
              title="Toggle assumptions panel"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="0" y="1" width="14" height="2" rx="1" />
                <rect x="0" y="6" width="14" height="2" rx="1" />
                <rect x="0" y="11" width="14" height="2" rx="1" />
              </svg>
            </button>

            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}

            {/* Print button */}
            <div className="ml-auto flex items-center gap-2 py-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
              >
                <Printer size={12} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Tab content */}
          <main className="flex-1 overflow-y-auto p-5">
            {activeTab === 'overview' && (
              <OverviewTab projection={projection} assumptions={assumptions} />
            )}
            {activeTab === 'montecarlo' && (
              <MonteCarloTab
                mcResults={mcResults}
                projection={projection}
                assumptions={assumptions}
              />
            )}
            {activeTab === 'stress' && (
              <StressTestTab
                sequenceCrashes={sequenceCrashes}
                staticScenarios={staticScenarios}
                assumptions={assumptions}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetTab projection={projection} assumptions={assumptions} />
            )}
            {activeTab === 'progress' && (
              <ProgressTab
                projection={projection}
                assumptions={assumptions}
                actuals={actuals}
                onUpdateActuals={setActuals}
              />
            )}
          </main>
        </div>
      </div>

      {/* ── Print footer ── */}
      <div className="hidden print:block text-xs text-gray-500 text-center p-4 border-t">
        FIRE Plan · Warrick Tunmer · Generated {new Date().toLocaleDateString('en-AU')} ·
        All values nominal AUD · Not financial advice
      </div>
    </div>
  );
}
