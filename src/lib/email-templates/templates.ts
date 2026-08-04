// Copy for the provider re-engagement drip (see STAGES in
// src/routes/api/public/hooks/provider-reengagement.ts) plus any other
// transactional templates. Kept as plain functions rather than a template
// engine — five short nudge emails don't need one.

export type TemplateData = Record<string, unknown>;

export type RenderedEmail = { subject: string; html: string; text: string };

function shell(
  firstName: string,
  bodyHtml: string,
  bodyText: string,
): { html: string; text: string } {
  return {
    html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
      <p>Hi ${firstName},</p>
      ${bodyHtml}
      <p style="margin-top:24px"><a href="https://getcompanioncare.com/onboarding/provider" style="color:#0f766e">Finish setting up your account →</a></p>
      <p style="margin-top:32px;font-size:12px;color:#666">CareMatch · you're receiving this because you started a caregiver application.</p>
    </div>`,
    text: `Hi ${firstName},\n\n${bodyText}\n\nFinish setting up: https://getcompanioncare.com/onboarding/provider`,
  };
}

// Generic shell for transactional emails that aren't part of the provider
// drip — no onboarding CTA, no "you started an application" footer.
function plainShell(
  firstName: string,
  bodyHtml: string,
  bodyText: string,
): { html: string; text: string } {
  return {
    html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
      <p>Hi ${firstName},</p>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#666">CareMatch</p>
    </div>`,
    text: `Hi ${firstName},\n\n${bodyText}`,
  };
}

const RENDERERS: Record<string, (data: TemplateData) => RenderedEmail> = {
  "provider-drip-day1": (data) => {
    const firstName = String(data.first_name ?? "there");
    const { html, text } = shell(
      firstName,
      "<p>You're a few minutes from your first shift. Pick up where you left off.</p>",
      "You're a few minutes from your first shift. Pick up where you left off.",
    );
    return {
      subject: String(data.subject ?? "You're almost there — finish in 3 minutes"),
      html,
      text,
    };
  },
  "provider-drip-day3": (data) => {
    const firstName = String(data.first_name ?? "there");
    const { html, text } = shell(
      firstName,
      "<p>Dolores has been a CareMatch caregiver for 8 months and loves the flexible schedule. Caregivers like her are waiting for someone like you to join.</p>",
      "Dolores has been a CareMatch caregiver for 8 months and loves the flexible schedule. Caregivers like her are waiting for someone like you to join.",
    );
    return { subject: String(data.subject ?? "Meet Dolores."), html, text };
  },
  "provider-drip-day7": (data) => {
    const firstName = String(data.first_name ?? "there");
    const { html, text } = shell(
      firstName,
      "<p>Families in your area are booking visits this week. Finish your application and you could be matched by the weekend.</p>",
      "Families in your area are booking visits this week. Finish your application and you could be matched by the weekend.",
    );
    return {
      subject: String(data.subject ?? "Your first shift could be this weekend"),
      html,
      text,
    };
  },
  "provider-drip-day14": (data) => {
    const firstName = String(data.first_name ?? "there");
    const { html, text } = shell(
      firstName,
      "<p>We'll cover $25 toward your background check if you finish your application this week.</p>",
      "We'll cover $25 toward your background check if you finish your application this week.",
    );
    return {
      subject: String(data.subject ?? "Still interested? Here's $25 to finish."),
      html,
      text,
    };
  },
  "provider-drip-day30": (data) => {
    const firstName = String(data.first_name ?? "there");
    const { html, text } = shell(
      firstName,
      "<p>We haven't heard from you in a while, so this is our last check-in. If now isn't the right time, no hard feelings — you're welcome back anytime.</p>",
      "We haven't heard from you in a while, so this is our last check-in. If now isn't the right time, no hard feelings — you're welcome back anytime.",
    );
    return { subject: String(data.subject ?? "One more thing before we say goodbye"), html, text };
  },
  "support-ticket-confirmation": (data) => {
    const firstName = String(data.first_name ?? "there");
    const subject = String(data.ticket_subject ?? "your request");
    const { html, text } = plainShell(
      firstName,
      `<p>We got your message about "<strong>${subject}</strong>" and a real person will reply within 1 business day.</p>
       <p>If anything is urgent, call the concierge line at 1 (800) 227-3628 — a real person answers 24/7.</p>`,
      `We got your message about "${subject}" and a real person will reply within 1 business day.\n\nIf anything is urgent, call the concierge line at 1 (800) 227-3628 — a real person answers 24/7.`,
    );
    return { subject: `We got your message: ${subject}`, html, text };
  },
  "visit-reminder": (data) => {
    const firstName = String(data.first_name ?? "there");
    const providerName = String(data.provider_name ?? "your caregiver");
    const when = String(data.when ?? "soon");
    const serviceType = String(data.service_type ?? "visit");
    const { html, text } = plainShell(
      firstName,
      `<p>Just a reminder — <strong>${providerName}</strong> is scheduled for a ${serviceType} visit ${when}.</p>
       <p>Need to change or cancel? Open the visit in your CareMatch app, or call the concierge at 1 (800) 227-3628.</p>`,
      `Just a reminder — ${providerName} is scheduled for a ${serviceType} visit ${when}.\n\nNeed to change or cancel? Open the visit in your CareMatch app, or call the concierge at 1 (800) 227-3628.`,
    );
    return { subject: `Reminder: ${providerName} visits ${when}`, html, text };
  },
};

export function renderTemplate(templateCode: string, data: TemplateData): RenderedEmail | null {
  const renderer = RENDERERS[templateCode];
  return renderer ? renderer(data) : null;
}
