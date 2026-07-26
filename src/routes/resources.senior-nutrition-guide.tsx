import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero, CTASection } from "@/components/marketing/PageShell";
import {
  ArticleBody,
  ArticleMeta,
  ArticleTLDR,
  KeyStats,
  ArticleFAQ,
  RelatedPosts,
  articleHead,
} from "@/components/marketing/ArticleLayout";

const path = "/resources/senior-nutrition-guide";
const title = "Senior Nutrition: Why Older Adults Stop Eating, and How to Fix It";
const description =
  "One in two older adults is at risk of malnutrition. The causes — appetite loss, dental issues, medications, loneliness — and the practical fixes that get real food back on the plate.";
const datePublished = "2026-06-25";
const category = "Health";

const faq = [
  {
    q: "How much weight loss is a red flag?",
    a: "A 5% drop in body weight over 6 months, or 10% over a year, is clinically meaningful and worth a doctor's visit. Faster than that — say, 5+ pounds in a month — warrants a call now. Unexplained weight loss in older adults is one of the strongest predictors of hospitalization and decline.",
  },
  {
    q: "Do older adults really need less food?",
    a: "Fewer calories, yes — but the same amount of protein, and more of certain nutrients like B12, calcium, and vitamin D. This is why 'they're not that hungry, it's fine' is often wrong. The volume can drop; the nutrient density needs to go up.",
  },
  {
    q: "What's the single biggest cause of poor eating in older adults?",
    a: "Eating alone. Studies consistently show older adults eating in company consume 20-30% more calories and choose more varied foods. A shared meal — with family or a caregiver — is one of the highest-impact nutrition interventions.",
  },
  {
    q: "Are meal-delivery services worth it?",
    a: "For most older adults living alone, yes. Meals on Wheels (subsidized, income-based, often free) delivers a hot meal plus a wellness check. Commercial services like Silver Cuisine or Mom's Meals are $8–$12/meal for senior-specific portions. Both beat cereal for dinner.",
  },
];

export const Route = createFileRoute("/resources/senior-nutrition-guide")({
  head: () =>
    articleHead({ path, title, description, datePublished, section: category, faq }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <PageShell>
      <PageHero eyebrow={category} title={title} lead={description} />
      <ArticleBody>
        <ArticleMeta category={category} datePublished={datePublished} readMins={9} />

        <ArticleTLDR
          points={[
            "1 in 2 older adults is at risk of malnutrition — the norm, not the exception.",
            "5% weight loss over 6 months is a medical red flag.",
            "Eating alone is the single biggest driver. Company at meals fixes more than any supplement.",
            "Protein goals stay the same as adulthood — even when appetite drops.",
          ]}
        />

        <p>
          If your parent has stopped enjoying food, or the fridge tells a story about
          empty calories and skipped meals, you're seeing one of the quietest health
          crises in senior care. Malnutrition doesn't announce itself — it just makes
          everything else worse.
        </p>

        <KeyStats
          items={[
            { stat: "50%", label: "of older adults at risk of malnutrition" },
            { stat: "1.2g/kg", label: "Recommended daily protein for older adults" },
            { stat: "30%", label: "More calories consumed when eating with others" },
          ]}
        />

        <h2>Why appetite drops with age</h2>
        <ol>
          <li><strong>Smell and taste dull.</strong> Food genuinely tastes less interesting. Adding herbs, spice, and acid (lemon, vinegar) matters more than salt.</li>
          <li><strong>Dental issues.</strong> Missing teeth, ill-fitting dentures, gum pain — chewing gets harder, so protein and vegetables drop out first.</li>
          <li><strong>Medications.</strong> Common culprits: metformin, digoxin, SSRIs, statins, many chemotherapy agents. Ask a pharmacist for a review.</li>
          <li><strong>Depression.</strong> Under-diagnosed in older adults and one of the top causes of appetite loss.</li>
          <li><strong>Constipation.</strong> Very common; makes eating uncomfortable.</li>
          <li><strong>Loneliness.</strong> Meals are social. Eating alone reliably reduces intake.</li>
          <li><strong>Physical difficulty.</strong> Standing to cook, lifting a pan, reading a can — small barriers add up.</li>
        </ol>

        <h2>The five-thing weekly plan</h2>
        <ol>
          <li><strong>Protein at every meal.</strong> Eggs, Greek yogurt, cottage cheese, canned fish, shredded chicken, beans. Target 20–30g per meal, ~1.0–1.2g per kg body weight daily. This is the single highest-priority nutrient — it's what preserves muscle and prevents falls.</li>
          <li><strong>Shared meal at least three times a week.</strong> Family visit, neighbor, caregiver, senior center lunch, video call while eating. Doesn't have to be fancy.</li>
          <li><strong>One "big cook" a week.</strong> Batch cook or have someone cook one hot meal that yields three servings. Freeze two.</li>
          <li><strong>Fortified milk or protein shake as insurance.</strong> Boost, Ensure, or homemade smoothie with Greek yogurt, banana, and peanut butter. Between meals — not instead of.</li>
          <li><strong>Water on the counter, visible.</strong> Thirst signals dull with age. Aim for 6–8 cups a day; more in heat or with certain meds.</li>
        </ol>

        <h2>Foods that punch above their weight</h2>
        <ul>
          <li>Eggs — cheap, easy, complete protein, easy to chew.</li>
          <li>Greek yogurt — protein + calcium + probiotics.</li>
          <li>Canned salmon or sardines — omega-3s, protein, calcium (from soft bones), no cooking.</li>
          <li>Nut butters — dense calories, protein, easy to eat.</li>
          <li>Avocado — dense calories, easy to chew.</li>
          <li>Cooked oatmeal with milk and nuts — fortified, warm, comforting.</li>
          <li>Soups with beans and greens — hydration + protein + fiber.</li>
        </ul>

        <h2>Practical fixes for common blockers</h2>
        <ul>
          <li><strong>Can't stand to cook:</strong> a stool at the counter, a slow cooker, meal delivery, a caregiver who cooks two meals a week.</li>
          <li><strong>Can't chew well:</strong> stews, casseroles, eggs, smoothies, soft protein-rich foods. Book the dentist.</li>
          <li><strong>Food doesn't taste like anything:</strong> lemon juice, vinegar, herbs, spice. Cut salt only where medically necessary — flavor matters more than most families think.</li>
          <li><strong>Loneliness:</strong> senior-center lunches, Meals on Wheels (delivers a person along with a meal), a companion caregiver at lunch or dinner.</li>
          <li><strong>Grocery shopping is a barrier:</strong> Instacart, Walmart+, an errand caregiver, or a family member doing a shared weekly list.</li>
        </ul>

        <h2>When to call the doctor</h2>
        <ul>
          <li>5% weight loss in 6 months (or 10 lb in an average-weight adult).</li>
          <li>Clothes visibly loose across two visits.</li>
          <li>Food avoidance for a specific type (may signal swallowing issues).</li>
          <li>New difficulty swallowing, choking, or coughing during meals — this is urgent.</li>
        </ul>

        <p>
          For anyone who's stopped enjoying meals, the fastest fix is usually company —{" "}
          <Link to="/services/companionship">a companion caregiver at meal times</Link>{" "}
          often does more for nutrition than any supplement. If cooking is the
          barrier, an <Link to="/services/errands">errands-and-meal-prep aide</Link>{" "}
          takes the whole task off the plate.
        </p>

        <ArticleFAQ items={faq} />

        <RelatedPosts
          items={[
            {
              to: "/resources/signs-parent-needs-help",
              title: "Signs Your Parent Needs Help",
              category: "Planning",
              readMins: 9,
            },
            {
              to: "/resources/medication-management-seniors",
              title: "Medication Management for Seniors",
              category: "Health",
              readMins: 10,
            },
            {
              to: "/resources/fall-prevention-seniors",
              title: "Fall Prevention at Home",
              category: "Safety",
              readMins: 8,
            },
          ]}
        />
      </ArticleBody>
      <CTASection />
    </PageShell>
  );
}
