import type { VendorAdapter } from "../vendor";

/**
 * Checkr adapter stub. Fill in when we flip BACKGROUND_CHECK_VENDOR=checkr.
 * All methods throw so a misconfiguration surfaces immediately instead of
 * silently ordering the wrong package.
 */
export const checkrAdapter: VendorAdapter = {
  vendor: "checkr",
  packageCodeFor() {
    throw new Error("Checkr adapter not implemented yet.");
  },
  async createCandidate() {
    throw new Error("Checkr adapter not implemented yet.");
  },
  async orderCheck() {
    throw new Error("Checkr adapter not implemented yet.");
  },
  verifyWebhookSignature() {
    return false;
  },
  normalizeEvent() {
    throw new Error("Checkr adapter not implemented yet.");
  },
};
