import BookingForm from "./booking-form";

export default function BookPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="30" width="84" height="60" rx="12" fill="#7899af"/>
            <rect x="18" y="16" width="32" height="18" rx="8" fill="#6a88a0"/>
            <circle cx="72" cy="24" r="8" fill="#d4838d"/>
            <circle cx="50" cy="62" r="24" fill="#8b5e3c"/>
            <circle cx="50" cy="62" r="19" fill="#e8a0a8"/>
            <circle cx="50" cy="62" r="14" fill="#1a2a38"/>
            <circle cx="50" cy="62" r="9" fill="#4a7a9b"/>
            <circle cx="43" cy="55" r="4" fill="#6b9ab8" opacity="0.6"/>
            <circle cx="42" cy="54" r="2.5" fill="white" opacity="0.5"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>Book a Service Call</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Blossomwood Building Co. · HVAC · Plumbing · Electrical</p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 16px 64px" }}>
        <BookingForm />
      </div>
    </div>
  );
}
