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
      <p style="margin-top:24px"><a href="https://carematcher.lovable.app/onboarding/provider" style="color:#0f766e">Finish setting up your account →</a></p>
      <p style="margin-top:32px;font-size:12px;color:#666">CareMatch · you're receiving this because you started a caregiver application.</p>
    </div>`,
    text: `Hi ${firstName},\n\n${bodyText}\n\nFinish setting up: https://carematcher.lovable.app/onboarding/provider`,
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
};

export function renderTemplate(templateCode: string, data: TemplateData): RenderedEmail | null {
  const renderer = RENDERERS[templateCode];
  return renderer ? renderer(data) : null;
}
