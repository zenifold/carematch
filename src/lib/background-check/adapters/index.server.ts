import type { VendorAdapter, VendorId } from "../vendor";
import { certnAdapter } from "./certn.server";
import { checkrAdapter } from "./checkr.server";

export function getAdapter(vendor: VendorId): VendorAdapter {
  switch (vendor) {
    case "certn":
      return certnAdapter;
    case "checkr":
      return checkrAdapter;
    default:
      throw new Error(`Background check vendor "${vendor}" is not configured.`);
  }
}
