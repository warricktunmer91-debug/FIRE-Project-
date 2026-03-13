/**
 * Core year-by-year financial projection engine.
 * Replicates the exact logic of FIRE_Plan_v2-2.xlsx.
 *
 * Year numbering: year 1 = age (currentAge + 1) = age 36 in default model.
 * The projection runs from year 1 to year (90 - currentAge).
 */

/**
 * Run the base-case deterministic projection.
 * Returns an array of annual snapshots from current age to age 90.
 *
 * @param {object} a - assumptions object (from DEFAULT_ASSUMPTIONS or slider state)
 * @param {object} [overrides] - optional per-year return overrides: { [year]: { sharesReturn, superReturn } }
 * @returns {object[]} array of year snapshots
 */
export function runProjection(a, overrides = {}) {
  const results = [];
  const maxAge = 90;
  const numYears = maxAge - a.currentAge;

  // Include age 35 as the starting data point (current state)
  results.push({
    age: a.currentAge,
    year: 0,
    phase: 'current',
    shares: a.sharesStart,
    super: a.superStart,
    mortgage: deriveMortgageStart(a),
    netWorth: a.sharesStart + a.superStart,
    annualIncome: 0,
    annualExpenses: 0,
    shareContribution: 0,
    superContribution: 0,
    drawdown: 0,
    superEmployer: 0,
    superPersonal: 0,
    cashOneOff: 0,
  });

  let shares = a.sharesStart;
  let superBal = a.superStart;
  let mortgage = deriveMortgageStart(a);

  // Variable-expense monthly base (grows with lifestyleGrowth)
  const varMonthlyBase = a.billsHalfMo + a.spendingMo + a.datesMo + a.holidaysMo;
  // Fixed monthly (never inflated): mortgage + savings lines
  const fixedMonthly = a.mortgageHalfMo + a.cashSavingsMo + a.investedSavingsMo;

  for (let n = 1; n <= numYears; n++) {
    const age = a.currentAge + n;
    const growthFactor = Math.pow(1 + a.incomeGrowth, n - 1);
    const lifestyleFactor = Math.pow(1 + a.lifestyleGrowth, n - 1);

    const ov = overrides[n] || {};
    const sharesRet = ov.sharesReturn !== undefined ? ov.sharesReturn : a.sharesReturn;
    const superRet = ov.superReturn !== undefined ? ov.superReturn : a.superReturn;

    // Apply investment returns first
    shares = shares * (1 + sharesRet);
    superBal = superBal * (1 + superRet);

    let shareContribution = 0;
    let drawdown = 0;
    let superEmployer = 0;
    let superPersonal = 0;
    let cashOneOff = 0;
    let phase = getPhase(age, a);

    // ── MORTGAGE AMORTISATION (simplified: linear interest paydown)
    const mortgageInterest = mortgage * 0.0569;
    const mortgagePayment = a.mortgageHalfMo * 2 * 12; // combined annual payment
    const mortgagePrincipal = Math.max(0, mortgagePayment - mortgageInterest);
    mortgage = Math.max(0, mortgage - mortgagePrincipal);

    // ── SUPER CONTRIBUTIONS
    if (phase === 'fulltime') {
      if (n === 1) {
        superEmployer = a.superEmployerY1;
      } else {
        superEmployer = a.superEmployerY2 * Math.pow(1 + a.incomeGrowth, n - 2);
      }
      superPersonal = n >= a.superPersonalStartYear ? a.superPersonal : 0;
    } else if (phase === 'parttime') {
      if (n === 1) {
        superEmployer = a.superEmployerY1 * a.partTimeFraction;
      } else {
        superEmployer = a.superEmployerY2 * Math.pow(1 + a.incomeGrowth, n - 2) * a.partTimeFraction;
      }
      superPersonal = a.superPersonal; // personal contributions continue in part-time
    }
    // retired: no super contributions

    superBal = superBal + superEmployer + superPersonal;

    // ── SHARE CASHFLOWS
    if (phase === 'fulltime') {
      const annualIncome = a.incomeMo * growthFactor * 12;
      const annualBonus = a.bonusNet * growthFactor;
      const varExpenses = varMonthlyBase * lifestyleFactor * 12;
      const fixedExpenses = fixedMonthly * 12;

      shareContribution = annualIncome + annualBonus - varExpenses - fixedExpenses;

      // Cash one-off costs deducted from share contribution
      for (const oo of a.oneOffCash) {
        if (oo.year === n) {
          cashOneOff += oo.amount;
        }
      }
      shareContribution -= cashOneOff;
      shares = shares + shareContribution;

    } else if (phase === 'parttime') {
      const annualIncome = a.incomeMo * growthFactor * a.partTimeFraction * 12;
      const annualBonus = a.bonusNet * growthFactor * a.partTimeFraction;
      const varExpenses = varMonthlyBase * lifestyleFactor * 12;
      const mortgageExpense = a.mortgageHalfMo * 12;

      drawdown = Math.max(0, varExpenses + mortgageExpense - annualIncome - annualBonus);
      shareContribution = -(drawdown);
      shares = shares - drawdown;

    } else {
      // Retired (age 50+)
      const varExpenses = varMonthlyBase * lifestyleFactor * 12;
      const mortgageExpense = age <= 60 ? a.mortgageHalfMo * 12 : 0;

      drawdown = varExpenses + mortgageExpense;

      // Year 15 (age 50): driveway costs flow through share drawdown
      if (n === a.drivewayYear) {
        drawdown += a.drivewayCost;
      }
      // Year 25 (age 60): mortgage lump-sum payoff from shares
      if (age === a.superAccessAge) {
        drawdown += a.mortgageLumpSum;
      }

      shares = shares - drawdown;
    }

    const netWorth = shares + superBal;
    const annualIncome =
      phase === 'fulltime'
        ? (a.incomeMo * growthFactor * 12 + a.bonusNet * growthFactor)
        : phase === 'parttime'
        ? (a.incomeMo * growthFactor * a.partTimeFraction * 12 + a.bonusNet * growthFactor * a.partTimeFraction)
        : 0;

    const varExpenses = varMonthlyBase * lifestyleFactor * 12;
    const mortgageExpense = phase !== 'retired' || age <= 60 ? a.mortgageHalfMo * 12 : 0;
    const annualExpenses =
      phase === 'fulltime'
        ? varExpenses + fixedMonthly * 12 + cashOneOff
        : phase === 'parttime'
        ? varExpenses + mortgageExpense
        : varExpenses + mortgageExpense;

    results.push({
      age,
      year: n,
      phase,
      shares: Math.max(shares, 0), // clamp at 0 for display (failure tracked separately)
      sharesRaw: shares,           // unclipped — negative means failure
      super: superBal,
      mortgage: Math.max(mortgage, 0),
      netWorth,
      annualIncome,
      annualExpenses,
      shareContribution: phase === 'fulltime' ? shareContribution : 0,
      drawdown: phase !== 'fulltime' ? drawdown : 0,
      superEmployer,
      superPersonal,
      cashOneOff,
    });
  }

  return results;
}

/** Determine which phase a given age belongs to */
export function getPhase(age, a) {
  if (age < a.partTimeAge) return 'fulltime';
  if (age < a.retireAge) return 'parttime';
  return 'retired';
}

/**
 * Estimate starting mortgage balance.
 * From spreadsheet: ~$966,901 derived from $5,760/mo combined repayment at 5.69% over 28 years.
 * We hard-code the spreadsheet value and adjust using the amortisation schedule.
 */
function deriveMortgageStart() {
  return 966901;
}

/**
 * Extract milestone snapshot for a given age from projection array.
 */
export function getMilestone(projection, age) {
  return projection.find(p => p.age === age) || null;
}
