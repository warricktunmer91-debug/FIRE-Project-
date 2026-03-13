/**
 * Monte Carlo simulation engine.
 * Phase 1: Runs N simulations with randomised annual returns (normal distribution).
 * Plan FAILS if share portfolio goes below $0 before superAccessAge.
 */

import { getPhase } from './projection.js';

// ── Box-Muller transform for N(0,1) random sample ─────────────────────────
function randNormal() {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function randNormalMV(mean, sd) {
  return mean + sd * randNormal();
}

// ── Percentile of a sorted array ──────────────────────────────────────────
function percentile(sorted, p) {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Run Monte Carlo simulation.
 *
 * @param {object} a - assumptions
 * @param {number} [numSims=5000]
 * @returns {{
 *   percentileBands: object[],   // per-age: { age, p10, p25, p50, p75, p90, basedCase }
 *   successRate: number,          // 0-1
 *   failCount: number,
 *   numSims: number,
 *   probAbove2M_at50: number,
 *   probAbove3M_at50: number,
 * }}
 */
export function runMonteCarlo(a, numSims = 5000) {
  const maxAge = 85;
  const ages = [];
  for (let age = a.currentAge + 1; age <= maxAge; age++) ages.push(age);

  // Storage: per age-index, array of share balances across simulations
  const shareSamples = ages.map(() => []);
  const superSamples = ages.map(() => []);

  let failCount = 0;
  let above2M_at50 = 0;
  let above3M_at50 = 0;

  const varMonthlyBase = a.billsHalfMo + a.spendingMo + a.datesMo + a.holidaysMo;
  const fixedMonthly = a.mortgageHalfMo + a.cashSavingsMo + a.investedSavingsMo;

  for (let sim = 0; sim < numSims; sim++) {
    let shares = a.sharesStart;
    let superBal = a.superStart;
    let failed = false;

    for (let i = 0; i < ages.length; i++) {
      const age = ages[i];
      const n = age - a.currentAge; // model year number (1-indexed)
      const phase = getPhase(age, a);
      const growthFactor = Math.pow(1 + a.incomeGrowth, n - 1);
      const lifestyleFactor = Math.pow(1 + a.lifestyleGrowth, n - 1);

      // Randomise returns
      const sharesRet = randNormalMV(a.sharesReturn, a.sharesSD);
      const superRet = randNormalMV(a.superReturn, a.superSD);

      shares = shares * (1 + sharesRet);
      superBal = superBal * (1 + superRet);

      // Super contributions (deterministic)
      let superEmployer = 0, superPersonal = 0;
      if (phase === 'fulltime') {
        superEmployer = n === 1 ? a.superEmployerY1 : a.superEmployerY2 * Math.pow(1 + a.incomeGrowth, n - 2);
        superPersonal = n >= a.superPersonalStartYear ? a.superPersonal : 0;
      } else if (phase === 'parttime') {
        superEmployer = (n === 1 ? a.superEmployerY1 : a.superEmployerY2 * Math.pow(1 + a.incomeGrowth, n - 2)) * a.partTimeFraction;
        superPersonal = a.superPersonal;
      }
      superBal += superEmployer + superPersonal;

      // Share cashflows (deterministic, same as base case)
      if (phase === 'fulltime') {
        const annualIncome = a.incomeMo * growthFactor * 12;
        const annualBonus = a.bonusNet * growthFactor;
        const varExpenses = varMonthlyBase * lifestyleFactor * 12;
        let contrib = annualIncome + annualBonus - varExpenses - fixedMonthly * 12;
        for (const oo of a.oneOffCash) {
          if (oo.year === n) contrib -= oo.amount;
        }
        shares += contrib;
      } else if (phase === 'parttime') {
        const annualIncome = a.incomeMo * growthFactor * a.partTimeFraction * 12;
        const annualBonus = a.bonusNet * growthFactor * a.partTimeFraction;
        const varExpenses = varMonthlyBase * lifestyleFactor * 12;
        const mortgageExpense = a.mortgageHalfMo * 12;
        const drawdown = Math.max(0, varExpenses + mortgageExpense - annualIncome - annualBonus);
        shares -= drawdown;
      } else {
        // Retired
        const varExpenses = varMonthlyBase * lifestyleFactor * 12;
        const mortgageExpense = age <= a.superAccessAge ? a.mortgageHalfMo * 12 : 0;
        let drawdown = varExpenses + mortgageExpense;
        if (n === a.drivewayYear) drawdown += a.drivewayCost;
        if (age === a.superAccessAge) drawdown += a.mortgageLumpSum;
        shares -= drawdown;
      }

      // Check failure: shares go negative before super access age
      if (shares < 0 && age < a.superAccessAge && !failed) {
        failed = true;
        failCount++;
      }

      shareSamples[i].push(shares);
      superSamples[i].push(superBal);

      // Milestone checks at retire age
      if (age === a.retireAge) {
        if (shares >= 2_000_000) above2M_at50++;
        if (shares >= 3_000_000) above3M_at50++;
      }
    }
  }

  // Compute percentile bands
  const percentileBands = ages.map((age, i) => {
    const ss = [...shareSamples[i]].sort((x, y) => x - y);
    return {
      age,
      p10: percentile(ss, 10),
      p25: percentile(ss, 25),
      p50: percentile(ss, 50),
      p75: percentile(ss, 75),
      p90: percentile(ss, 90),
    };
  });

  return {
    percentileBands,
    successRate: (numSims - failCount) / numSims,
    failCount,
    numSims,
    probAbove2M_at50: above2M_at50 / numSims,
    probAbove3M_at50: above3M_at50 / numSims,
  };
}
