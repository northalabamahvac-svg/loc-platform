export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const meta = user.user_metadata ?? {};
  return (
    <SettingsClient
      userId={user.id}
      initialBusinessName={meta.business_name ?? "Blossomwood Building Co."}
      initialBusinessPhone={meta.business_phone ?? ""}
      initialBusinessHours={meta.business_hours ?? ""}
      initialLogoUrl={meta.business_logo_url ?? ""}
      initialServiceTypes={meta.service_types ?? ["AC Repair", "Heating", "Maintenance", "New Install", "Ductwork", "Other"]}
      initialBookingNotifications={meta.booking_notifications ?? true}
      initialEstimateNotifications={meta.estimate_notifications ?? true}
      initialGpsEnabled={meta.gps_enabled ?? true}
      initialWatermarkEnabled={meta.watermark_enabled ?? false}
      initialEstimateExpiry={meta.estimate_expiry_days ?? 30}
    />
  );
}
