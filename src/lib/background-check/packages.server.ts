import type { PackageTier } from "./vendor";

/**
 * Select the right package tier for a provider given their opted-in capabilities
 * and service tier. Cost scales with risk:
 *   basic             — companionship / errands only
 *   basic_plus        — hands-on personal care (bathing, transfers)
 *   enhanced_plus_mvr — driving / transport (adds MVR)
 *   enhanced          — clinical (CNA / LPN / RN / med tech / phlebotomy)
 */
export function pickPackageTier(input: {
  service_tier: number | null;
  capabilities: string[];
}): PackageTier {
  const caps = new Set(input.capabilities.map((c) => c.toLowerCase()));
  const tier = input.service_tier ?? 0;

  const drives = caps.has("transport") || caps.has("errands_driving") || caps.has("driving");
  const clinical = tier >= 3;
  const personalCare = tier >= 2 || caps.has("personal_care") || caps.has("bathing") || caps.has("transfers");

  if (clinical) return "enhanced";
  if (drives) return "enhanced_plus_mvr";
  if (personalCare) return "basic_plus";
  return "basic";
}

export function tierLabel(tier: PackageTier): string {
  switch (tier) {
    case "basic": return "Basic";
    case "basic_plus": return "Basic + county extension";
    case "enhanced": return "Enhanced (clinical)";
    case "enhanced_plus_mvr": return "Enhanced + driving record";
  }
}

export function tierEstimateCents(tier: PackageTier): number {
  switch (tier) {
    case "basic": return 2500;
    case "basic_plus": return 3500;
    case "enhanced": return 5500;
    case "enhanced_plus_mvr": return 4500;
  }
}
