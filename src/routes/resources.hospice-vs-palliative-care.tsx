import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection } from "@/components/marketing/PageShell";
import {
  ArticleBody,
  ArticleMeta,
  ArticleTLDR,
  ArticleFAQ,
  RelatedPosts,
  articleHead,
} from "@/components/marketing/ArticleLayout";

const path = "/resources/hospice-vs-palliative-care";
const title = "Hospice vs Palliative Care: A Family's Plain-English Guide";
const description =
  "Palliative care can start at any stage of a serious illness. Hospice is a specific Medicare benefit for the last 6 months. The differences, what each pays for, and when to ask.";
const datePublished = "2026-06-27";
const category = "Health";

const faq = [
  {
    q: "What's the actual difference between hospice and palliative care?",
    a: "Palliative care is comfort-focused care that can start at diagnosis of any serious illness — alongside curative treatment. Hospice is a specific Medicare benefit that begins when curative treatment stops and a doctor certifies a prognosis of 6 months or less. Every hospice is palliative care; not every palliative care is hospice.",
  },
  {
    q: "Does Medicare cover hospice?",
    a: "Yes, fully — the Medicare Hospice Benefit covers virtually all costs: nursing visits, aide visits, medications related to the terminal illness, equipment, chaplaincy, social work, and bereavement support for the family. Medicaid and most private insurance follow similar rules. The family pays essentially nothing.",
  },
  {
    q: "Does choosing hospice mean giving up?",
    a: "No. Hospice provides more care, not less — just care focused on comfort and quality of life instead of cure. Patients can leave hospice at any time to resume curative treatment. Many people on hospice stabilize enough to be discharged, then re-enroll later. Studies consistently show hospice patients live as long or longer than comparable patients getting aggressive treatment.",
  },
  {
    q: "When should we bring this up with a doctor?",
    a: "The 'surprise question' is the standard prompt: 'Would you be surprised if this patient died in the next 12 months?' If the answer is no, it's time to talk about palliative care and, when appropriate, hospice. Most families are referred to hospice too late — the median stay in the US is under 20 days, when the benefit is designed for 6 months.",
  },
];

export const Route = createFileRoute("/resources/hospice-vs-palliative-care")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={10} />

        <ArticleTLDR
          points={[
            "Palliative care = comfort care alongside any treatment, at any stage.",
            "Hospice = a specific Medicare benefit for a prognosis of 6 months or less, focused on comfort instead of cure.",
            "Medicare pays 100% of hospice — most families pay nothing out of pocket.",
            "US families are usually referred too late. Ask sooner than you think.",
          ]}
        />

        <p>
          These two terms get used interchangeably, but they mean specific things —
          and mixing them up costs families weeks or months of comfort, and thousands
          of dollars they didn't need to spend.
        </p>

        <h2>Palliative care — the broader category</h2>
        <p>
          Palliative care is specialty medical care focused on symptom relief and
          quality of life for people with serious illness. Two things to know:
        </p>
        <ul>
          <li>It can start <strong>at diagnosis</strong> of any serious illness — cancer, heart failure, COPD, kidney disease, dementia. You don't have to be dying.</li>
          <li>It runs <strong>alongside curative treatment</strong>. Chemotherapy and palliative care are not opposites — most cancer centers now offer both from day one.</li>
        </ul>
        <p>
          <strong>Who's on the team:</strong> a palliative-care physician, nurse,
          social worker, and often a chaplain. They coordinate with the primary
          medical team to manage pain, nausea, breathlessness, anxiety, and the hard
          conversations about goals of care.
        </p>
        <p>
          <strong>What it costs:</strong> Medicare and most insurance cover palliative
          consultations. Access is by physician referral — you can ask for it.
        </p>

        <h2>Hospice — the specific Medicare benefit</h2>
        <p>
          Hospice is a benefit under Medicare Part A (and most Medicaid and private
          insurance plans) triggered by two conditions:
        </p>
        <ol>
          <li>A doctor certifies a prognosis of <strong>6 months or less</strong> if the disease runs its usual course.</li>
          <li>The patient (or family) elects <strong>comfort-focused care</strong> instead of curative treatment for the terminal illness.</li>
        </ol>
        <p>
          <strong>What hospice provides</strong> — at home, in a nursing facility, or in a hospice house:
        </p>
        <ul>
          <li>Nursing visits (usually 1–3 times/week, more as needed).</li>
          <li>Hospice aide visits for personal care (bathing, changing).</li>
          <li>All medications related to the terminal illness.</li>
          <li>Medical equipment (hospital bed, oxygen, commode, wheelchair).</li>
          <li>Social work, chaplaincy, volunteer support.</li>
          <li>24/7 nurse hotline.</li>
          <li>Bereavement support for the family for 13 months after death.</li>
        </ul>
        <p>
          <strong>What hospice does NOT provide:</strong> 24-hour in-home caregiving.
          This is the biggest surprise for families. Hospice sends visits, not shifts.
          A family member or a hired caregiver still needs to be present between
          visits. This is where a private-pay{" "}
          <Link to="/services/personal-care">personal-care aide</Link> or a family
          caregiver fills the gap.
        </p>

        <h2>Common misconceptions</h2>
        <ul>
          <li><strong>"Signing on to hospice means giving up."</strong> No — hospice provides more care, not less. And you can leave any time.</li>
          <li><strong>"You have to be actively dying."</strong> No — the benefit is designed for the last 6 months of life. Waiting until the last week wastes it.</li>
          <li><strong>"Hospice means going somewhere."</strong> No — 98% of hospice happens at home or in the facility the person already lives in.</li>
          <li><strong>"Hospice controls all care."</strong> The patient keeps their primary doctor; hospice handles terminal-illness symptoms and coordinates.</li>
        </ul>

        <h2>When to raise it</h2>
        <p>The standard clinical prompt is the "surprise question":</p>
        <blockquote>
          "Would you be surprised if this patient died in the next 12 months?"
        </blockquote>
        <p>
          If the answer is <em>no</em>, that's the moment to ask the doctor about
          palliative care. Hospice becomes appropriate when the trajectory suggests
          the next 6 months.
        </p>

        <h2>Practical scripts for talking with doctors</h2>
        <ul>
          <li><em>"Can we bring in a palliative care consult to help with symptoms and planning?"</em></li>
          <li><em>"Given how she's been trending, would you be surprised if she were still with us in 6 months?"</em></li>
          <li><em>"What would hospice look like for someone in her situation?"</em></li>
          <li><em>"If we chose hospice, what would we lose access to — and what would we gain?"</em></li>
        </ul>

        <p>
          For the day-to-day care that hospice doesn't cover,{" "}
          <Link to="/services/companionship">a companion caregiver</Link> or{" "}
          <Link to="/services/personal-care">personal-care aide</Link> provides the
          hours-long presence hospice visits don't.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/hospital-to-home-transition",
              title: "Hospital-to-Home Discharge Checklist",
              category: "Health",
              readMins: 13,
            },
            {
              to: "/resources/caregiver-burnout",
              title: "Caregiver Burnout: Warning Signs",
              category: "Health",
              readMins: 10,
            },
            {
              to: "/resources/medicare-medicaid-home-care",
              title: "Does Medicare Pay for Home Care?",
              category: "Costs",
              readMins: 10,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
