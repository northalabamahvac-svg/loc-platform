import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingsClient from "./bookings-client";

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: bookings } = await service
    .from("cf_booking_requests")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch users from project members to populate "assign to"
  const { data: members } = await service
    .from("cf_project_members")
    .select("user_id")
    .order("user_id");

  const uniqueUserIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>📥 Booking Requests</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Inbound service requests from your booking page</p>
        </div>
        <BookingsClient initialBookings={bookings ?? []} userIds={uniqueUserIds} />
      </div>
    </div>
  );
}
