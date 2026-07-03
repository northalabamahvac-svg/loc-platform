export default function TimeclockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      {children}
    </div>
  );
}
