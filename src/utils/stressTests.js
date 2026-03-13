/**
 * Stress test scenarios — Phase 3 (sequence-of-returns risk) and
 * Phase 3b (spreadsheet static scenarios).
 */

import { runProjection, getPhase } from './projection.js';

/**
 * Phase 3: Sequence-of-returns crash scenarios.
 * A crash is applied to share returns only in the specified retirement year.
 * All other years use the base mean return.
 *
 * @param {object} a - assumptions
 * @returns {object} { base, crashY1_30, crashY3_30, crashY1_50 } — each is a projection array
 */
export function runSequenceCrashTests(a) {
  const retireYear = a.retireAge - a.currentAge; // e.g. 15 for age 50

  // Base case
  const base = runProjection(a);

  // Crash at year 1 of retirement (age 50) = model year 15: -30%
  const crashY1_30 = runProjection(a, { [retireYear]: { sharesReturn: -0.30 } });

  // Crash at year 3 of retirement (age 52) = model year 17: -30%
  const crashY3_30 = runProjection(a, { [retireYear + 2]: { sharesReturn: -0.30 } });

  // Severe crash at year 1 of retirement: -50%
  const crashY1_50 = runProjection(a, { [retireYear]: { sharesReturn: -0.50 } });

  return { base, crashY1_30, crashY3_30, crashY1_50 };
}

/**
 * Phase 3b: Static spreadsheet-style scenario comparison.
 * These match the Stress Tests sheet in FIRE_Plan_v2-2.xlsx.
 *
 * @param {object} a - assumptions
 * @returns {object[]} array of scenario result objects
 */
export function runStaticScenarios(a) {
  const scenarios = [
    { id: 'base',       label: 'Base Case',          sharesReturn: 0.10, bonus: a.bonusNet,   retireAge: a.retireAge },
    { id: 'ret7',       label: '7% Returns',          sharesReturn: 0.07, bonus: a.bonusNet,   retireAge: a.retireAge },
    { id: 'bonus10k',   label: '$10k Bonus',          sharesReturn: 0.10, bonus: 10000,        retireAge: a.retireAge },
    { id: 'retire52',   label: 'Retire Age 52',       sharesReturn: 0.10, bonus: a.bonusNet,   retireAge: 52 },
    { id: 'ret7b10k',   label: '7% + $10k Bonus',     sharesReturn: 0.07, bonus: 10000,        retireAge: a.retireAge },
    { id: 'ret7r52',    label: '7% + Retire 52',      sharesReturn: 0.07, bonus: a.bonusNet,   retireAge: 52 },
    { id: 'worst',      label: 'Worst Case',          sharesReturn: 0.07, bonus: 10000,        retireAge: 52 },
  ];

  return scenarios.map(s => {
    const modified = { ...a, sharesReturn: s.sharesReturn, bonusNet: s.bonus, retireAge: s.retireAge };
    const projection = runProjection(modified);

    const at45 = projection.find(p => p.age === 45);
    const atRetire = projection.find(p => p.age === s.retireAge);
    const at60 = projection.find(p => p.age === 60);

    // Minimum share balance between retirement and age 60
    const retireToSuper = projection.filter(p => p.age >= s.retireAge && p.age <= 60);
    const minShares = Math.min(...retireToSuper.map(p => p.sharesRaw !== undefined ? p.sharesRaw : p.shares));

    const annualDrawdownAt51 = projection.find(p => p.age === s.retireAge + 1)?.drawdown || 0;
    const wr = atRetire ? annualDrawdownAt51 / atRetire.shares : 0;

    const passes = minShares >= 0;

    return {
      ...s,
      projection,
      at45Shares: at45?.shares || 0,
      atRetireShares: atRetire?.shares || 0,
      atRetireSuper: atRetire?.super || 0,
      combined60: at60 ? at60.shares + at60.super : 0,
      annualDrawdown: annualDrawdownAt51,
      withdrawalRate: wr,
      minShares,
      passes,
    };
  });
}
