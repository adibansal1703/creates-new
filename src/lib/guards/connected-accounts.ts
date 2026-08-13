import { redirect } from "@tanstack/react-router";
import { fetchConnectedAccounts } from "@/lib/api/connected-accounts";

export async function requireConnectedAccounts() {
  const accounts = await fetchConnectedAccounts();
  const connected = accounts.filter((a) => a.is_connected);

  if (connected.length === 0) {
    throw redirect({
      to: "/dashboard/accounts",
      search: { reason: "connect_required" },
    });
  }
}
