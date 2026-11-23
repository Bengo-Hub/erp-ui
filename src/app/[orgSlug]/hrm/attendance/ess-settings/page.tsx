import { redirect } from "next/navigation";

/**
 * This address used to show the general HR (PAYE, NSSF, SHIF, levy) settings under an attendance
 * title. Those settings live under Payroll settings > Tax & Statutory; attendance and self-service
 * clock-in rules live under Attendance settings. Old bookmarks land on the statutory page.
 */
export default async function EssSettingsRedirect({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/settings/payroll/statutory`);
}
