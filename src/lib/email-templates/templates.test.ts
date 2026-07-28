import { describe, expect, it } from "vitest";
import { renderTemplate } from "./templates";

describe("renderTemplate", () => {
  it("returns null for an unknown template code", () => {
    expect(renderTemplate("not-a-real-template", {})).toBeNull();
  });

  it("renders the support-ticket-confirmation template with the given data", () => {
    const email = renderTemplate("support-ticket-confirmation", {
      first_name: "Dana",
      ticket_subject: "Can't reach my mom's caregiver",
    });
    expect(email).not.toBeNull();
    expect(email!.subject).toContain("Can't reach my mom's caregiver");
    expect(email!.html).toContain("Dana");
    expect(email!.html).toContain("Can't reach my mom's caregiver");
    expect(email!.text).toContain("Dana");
  });

  it("renders the visit-reminder template with the given data", () => {
    const email = renderTemplate("visit-reminder", {
      first_name: "Marta",
      provider_name: "Nia Okafor",
      service_type: "companionship",
      when: "Tuesday at 2:00 PM",
    });
    expect(email!.subject).toContain("Nia Okafor");
    expect(email!.html).toContain("Nia Okafor");
    expect(email!.html).toContain("companionship");
    expect(email!.html).toContain("Tuesday at 2:00 PM");
  });

  it("falls back to sensible defaults when optional fields are missing", () => {
    const email = renderTemplate("visit-reminder", {});
    expect(email).not.toBeNull();
    expect(email!.html).toContain("there"); // default first name
    expect(email!.html).toContain("your caregiver"); // default provider name
  });

  it("renders every provider-drip stage without throwing and includes the first name", () => {
    for (const code of [
      "provider-drip-day1",
      "provider-drip-day3",
      "provider-drip-day7",
      "provider-drip-day14",
      "provider-drip-day30",
    ]) {
      const email = renderTemplate(code, { first_name: "Diego" });
      expect(email, `expected ${code} to render`).not.toBeNull();
      expect(email!.html).toContain("Diego");
      expect(email!.text).toContain("Diego");
      expect(email!.subject.length).toBeGreaterThan(0);
    }
  });
});
