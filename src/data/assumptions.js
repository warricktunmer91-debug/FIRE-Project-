/**
 * Default assumptions sourced directly from FIRE_Plan_v2-2.xlsx (verified March 2026).
 * All dollar values are nominal AUD. "Your half" refers to Warrick's share of joint costs.
 */
export const DEFAULT_ASSUMPTIONS = {
  // ── PERSONAL ──────────────────────────────────────────────────────────────
  currentAge: 35,
  partTimeAge: 45,   // year 10 in model
  retireAge: 50,     // year 15 in model
  superAccessAge: 60,

  // ── INCOME (your half, take-home after tax) ───────────────────────────────
  // 4 months office @ $8,500 net + 8 months FIFO @ $9,500 net = $110,000/yr
  incomeMo: 110000 / 12,   // = $9,166.67/month
  bonusNet: 20000,          // annual net bonus, fully invested
  incomeGrowth: 0.03,       // salary & bonus grow 3%/yr
  partTimeFraction: 0.50,   // 50% income & bonus during part-time phase

  // ── MONTHLY EXPENSES (your half) ─────────────────────────────────────────
  mortgageHalfMo: 2880,     // fixed — half of $5,760 combined
  billsHalfMo: 2100,        // half of $4,200 combined, grows with billsGrowth
  billsGrowth: 0.03,
  spendingMo: 800,           // personal discretionary
  datesMo: 150,              // date nights
  holidaysMo: 625,           // half of $15,000/yr holidays
  lifestyleGrowth: 0.03,     // spending / dates / holidays inflation
  cashSavingsMo: 750,        // to mortgage offset (not in share portfolio)
  investedSavingsMo: 750,    // budgeted share portfolio savings line

  // ── STARTING BALANCES ─────────────────────────────────────────────────────
  sharesStart: 297000,
  superStart: 176000,

  // ── INVESTMENT RETURNS ────────────────────────────────────────────────────
  sharesReturn: 0.10,
  sharesSD: 0.15,            // Monte Carlo standard deviation
  superReturn: 0.08,
  superSD: 0.08,             // Monte Carlo standard deviation

  // ── SUPERANNUATION ────────────────────────────────────────────────────────
  superEmployerY1: 16533,    // year 1 employer SG (12% of ~$137,774 gross)
  superEmployerY2: 17222,    // year 2+ base (12.5%), grows at incomeGrowth
  superPersonal: 10000,      // personal concessional, from year 6 (age 41)
  superPersonalStartYear: 6,

  // ── MORTGAGE ──────────────────────────────────────────────────────────────
  mortgageLumpSum: 802678,   // conservative payoff amount from shares at age 60
  // Combined mortgage $5,760/mo × 12 = $69,120/yr (captured via mortgageHalfMo × 2 × 12)

  // ── ONE-OFF CASH COSTS (deducted from share portfolio in that year) ────────
  // Year numbers are model years (year 1 = age 36)
  oneOffCash: [
    { year: 2,  amount: 10000, label: 'Pool Resurface' },     // age 37
    { year: 3,  amount: 7500,  label: '4x4 – Pmt 1' },       // age 38
    { year: 4,  amount: 7500,  label: '4x4 – Pmt 2' },       // age 39
  ],
  // Mortgage redraws (increase mortgage balance but flow through share drawdown at retirement)
  // Year 15 (age 50 — first retirement year): $45k driveway included in drawdown
  drivewayYear: 15,
  drivewayCost: 45000,
};

// Spreadsheet-verified milestone outputs (base case, not for user editing)
export const SPREADSHEET_MILESTONES = {
  age45: { shares: 1350306, super: 699899, combined: 2050205 },
  age50: { shares: 2001446, super: 1134074, combined: 3135520 },
  age55: { shares: 2569460, super: 1666326, combined: 4235786 },
  age60: { shares: 2611032, super: 2448380, combined: 5059412 },
  age65: { shares: 3609876, super: 3597474, combined: 7207350 },
};
