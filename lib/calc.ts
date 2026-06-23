export interface Transaction {
  id: string;
  type: "draw" | "payment";
  amount_cents: number;
  date: string; // YYYY-MM-DD
  note?: string | null;
}

export interface CalcResult {
  principal: number;       // cents
  accruedInterest: number; // cents
  totalOwed: number;       // cents
  dailyInterest: number;   // cents per day (today's rate)
  history: SnapShot[];
}

export interface SnapShot {
  date: string;
  type: "draw" | "payment" | "interest";
  amount: number;          // cents, positive
  principal: number;       // cents running balance
  accruedInterest: number; // cents
  totalOwed: number;       // cents
  note?: string | null;
}

export function calcLoc(transactions: Transaction[], apr: number): CalcResult {
  if (!transactions.length) {
    return { principal: 0, accruedInterest: 0, totalOwed: 0, dailyInterest: 0, history: [] };
  }

  const dr = apr / 365;
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().slice(0, 10);

  let principal = 0;
  let accruedInterest = 0;
  let lastDate = sorted[0].date;
  const history: SnapShot[] = [];

  function accrueThrough(toDate: string) {
    if (principal <= 0) { lastDate = toDate; return; }
    const days = daysBetween(lastDate, toDate);
    if (days <= 0) return;
    const interest = Math.round(principal * dr * days);
    accruedInterest += interest;
    if (interest > 0) {
      history.push({
        date: toDate,
        type: "interest",
        amount: interest,
        principal,
        accruedInterest,
        totalOwed: principal + accruedInterest,
      });
    }
    lastDate = toDate;
  }

  for (const tx of sorted) {
    accrueThrough(tx.date);

    if (tx.type === "draw") {
      principal += tx.amount_cents;
      history.push({
        date: tx.date,
        type: "draw",
        amount: tx.amount_cents,
        principal,
        accruedInterest,
        totalOwed: principal + accruedInterest,
        note: tx.note,
      });
    } else {
      // payment: interest first, then principal
      let remaining = tx.amount_cents;
      if (accruedInterest > 0) {
        const toInterest = Math.min(remaining, accruedInterest);
        accruedInterest -= toInterest;
        remaining -= toInterest;
      }
      if (remaining > 0) {
        principal = Math.max(0, principal - remaining);
      }
      history.push({
        date: tx.date,
        type: "payment",
        amount: tx.amount_cents,
        principal,
        accruedInterest,
        totalOwed: principal + accruedInterest,
        note: tx.note,
      });
    }
  }

  // Accrue to today
  accrueThrough(today);

  const dailyInterest = Math.round(principal * dr);

  return { principal, accruedInterest, totalOwed: principal + accruedInterest, dailyInterest, history };
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
