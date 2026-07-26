import type { IdvAdapter, IdvVendorId } from "../vendor";
import { stripeIdentityAdapter } from "./stripe-identity.server";

export function getIdvAdapter(vendor: IdvVendorId): IdvAdapter {
  switch (vendor) {
    case "stripe_identity":
      return stripeIdentityAdapter;
    default:
      throw new Error(`IDV vendor "${vendor}" is not configured.`);
  }
}
