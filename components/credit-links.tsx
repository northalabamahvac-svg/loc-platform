"use client";

const SERVICES = [
  { name: "Credit Karma",  desc: "Free TransUnion & Equifax scores",        url: "https://www.creditkarma.com",                                                            color: "#16a34a", icon: "🟢" },
  { name: "Experian",      desc: "Free Experian FICO® Score",                url: "https://www.experian.com/consumer-products/free-credit-report.html",                    color: "#0ea5e9", icon: "🔵" },
  { name: "myFICO",        desc: "Official FICO® scores from all 3 bureaus", url: "https://www.myfico.com",                                                                 color: "#7c3aed", icon: "🟣" },
  { name: "Annual Report", desc: "Free official report (gov mandated)",      url: "https://www.annualcreditreport.com",                                                     color: "#d97706", icon: "🟡" },
];

export default function CreditLinks() {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
        Check Your Real Credit Score
      </p>
      <div className="space-y-2">
        {SERVICES.map(s => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl p-3 transition-opacity hover:opacity-80"
            style={{ background: "var(--surfB)", border: "1px solid var(--bdrA)", textDecoration: "none" }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>{s.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.desc}</p>
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: s.color }}>Open →</span>
          </a>
        ))}
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
        Credit Karma and Experian offer free scores with no credit card required.
      </p>
    </div>
  );
}
