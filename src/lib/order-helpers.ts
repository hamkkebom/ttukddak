import { SupabaseClient } from "@supabase/supabase-js";

export async function verifyOrderPrice(
  sb: SupabaseClient,
  serviceId: string,
  packageName: string,
  clientPrice: number
): Promise<{ valid: boolean; expectedPrice: number }> {
  // 1. Try to find the package in service_packages
  const { data: pkg } = await sb
    .from("service_packages")
    .select("price")
    .eq("service_id", serviceId)
    .eq("name", packageName)
    .maybeSingle();

  if (pkg) {
    return { valid: pkg.price === clientPrice, expectedPrice: pkg.price };
  }

  // 2. Fallback: check service base price
  const { data: service } = await sb
    .from("services")
    .select("price")
    .eq("id", serviceId)
    .maybeSingle();

  if (!service) return { valid: false, expectedPrice: 0 };
  return { valid: service.price === clientPrice, expectedPrice: service.price };
}
