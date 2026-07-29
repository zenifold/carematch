// Companion Basics micro-course content. Correct answers live on the server
// only — the client renders lessons and questions but scoring is server-side.

export type Lesson = {
  title: string;
  body: string;
  key_points: string[];
};

export type Question = {
  id: string;
  scenario: string;
  choices: string[];
  correct_index: number;
  explanation: string;
};

export type Module = {
  code: string;
  title: string;
  intro: string;
  lessons: Lesson[];
  questions: Question[];
  pass_threshold: number;
};

export const COMPANION_BASICS_V1: Module = {
  code: "companion_basics_v1",
  title: "Companion Basics",
  intro:
    "Five short lessons on what companion-tier caregivers do — and just as importantly, what they don't. Then a 7-question check. You need 6 right to unlock jobs.",
  pass_threshold: 6,
  lessons: [
    {
      title: "1. Dementia 101 — meet them where they are",
      body:
        "About 1 in 3 seniors you'll visit have some memory decline. They may forget your name, repeat a story, or think it's 1978. That's not the disease being rude — it's the disease. Your job is to stay calm, agree with the world they're in right now, and gently redirect.",
      key_points: [
        "Never argue with the reality they're experiencing.",
        "Short sentences, warm tone, don't rush.",
        "If they're agitated, change the subject or the room.",
      ],
    },
    {
      title: "2. Fall prevention — the #1 way you save a life",
      body:
        "Falls are the leading cause of injury death in older adults. Most falls happen from a seated or standing transfer — getting out of a chair, off the toilet, into bed. As a companion, you don't physically assist these transfers at all — that's hands-on care outside your scope (see Lesson 5). What you CAN do: clear the path, remove hazards, and stay nearby so you can call for help fast if something goes wrong.",
      key_points: [
        "Rugs, cords, wet floors — flag them before someone trips.",
        "Don't physically help someone stand, sit, or transfer — that's hands-on care, not companion scope.",
        "If they fall, don't lift alone. Call for help; call us.",
      ],
    },
    {
      title: "3. Active listening — the actual paid work",
      body:
        "For most of your seniors, loneliness is the real illness. Sitting with someone, asking about their kids, letting them tell the same story again — that IS the job. That's what the family is paying for. Put your phone away.",
      key_points: [
        "Ask open questions: 'Tell me about that photo.'",
        "Don't interrupt or finish sentences.",
        "Silence is fine. You don't have to fill every gap.",
      ],
    },
    {
      title: "4. Boundaries — protect them, protect yourself",
      body:
        "You're a caregiver, not family. Don't take gifts of money. Don't discuss your personal financial troubles. Don't take them anywhere that isn't on the visit plan. Don't share your personal phone number — use the in-app chat.",
      key_points: [
        "No money, no gifts over ~$20, no borrowing anything.",
        "Never sign anything on their behalf.",
        "Family communication goes through the app.",
      ],
    },
    {
      title: "5. Scope of practice — what companion tier can (and can't) do",
      body:
        "As a Tier 0 companion, you can help with meals, light housekeeping, transportation, and companionship. You CANNOT give medications, do wound care, assist with bathing or toileting hands-on, or physically help someone transfer — in or out of a bed, chair, or toilet. Those all need PCA/HHA/CNA/clinical training. This isn't just a guideline — it's Virginia law: companion care is hands-off support only. If you're asked to do something outside your scope, decline politely and flag it in the app. You're not the one who looks bad for saying no — you're protecting yourself and them.",
      key_points: [
        "OK: cook, clean, drive, converse, remind them to take a pill.",
        "NOT OK: hand them the pill, help them shower, change a bandage, or physically help them up from a chair/bed/toilet.",
        "When in doubt, decline and tell us. You won't be punished for saying no.",
      ],
    },
  ],
  questions: [
    {
      id: "q1",
      scenario:
        "Mrs. Patel keeps telling you her husband is picking her up at 4pm. He passed away six years ago. What do you do?",
      choices: [
        "Gently correct her: 'Mrs. Patel, your husband passed in 2020.'",
        "Change the subject and say 'Tell me about how you two met.'",
        "Say nothing and let her keep waiting by the window.",
        "Call her daughter and tell her mom is confused.",
      ],
      correct_index: 1,
      explanation:
        "Never correct a dementia reality — it re-traumatizes them each time. Redirect with a warm memory question, then note it in your check-out summary.",
    },
    {
      id: "q2",
      scenario:
        "Mr. Chen asks you to hand him his blood pressure pill from the bottle on the counter. You're a Tier 0 companion.",
      choices: [
        "Hand him the pill — he asked for it.",
        "Refuse and end the visit early.",
        "Decline politely, remind him it's time for his med, and note it in the app.",
        "Ask him to open the bottle and just watch.",
      ],
      correct_index: 2,
      explanation:
        "Companions can REMIND, not administer. Handing a pill counts as med administration. Reminding, logging, and flagging is the right move.",
    },
    {
      id: "q3",
      scenario:
        "You arrive and see a small throw rug at the top of the stairs. Mrs. Alvarez uses a walker.",
      choices: [
        "Leave it — it's her house.",
        "Move it aside for the visit and mention it to her.",
        "Roll it up and throw it out.",
        "Ignore it, she'll be fine today.",
      ],
      correct_index: 1,
      explanation:
        "Loose rugs at stair tops are the single most common fall setup. Move it, tell her why, and note the hazard in your summary so family can decide.",
    },
    {
      id: "q4",
      scenario:
        "At the end of your visit Mr. Diaz tries to hand you $40 cash as a thank-you tip.",
      choices: [
        "Take it — it's his money and his choice.",
        "Politely decline and remind him tips go through the app.",
        "Accept but hide it from CareMatch.",
        "Take it and split it with his family later.",
      ],
      correct_index: 1,
      explanation:
        "Cash tips outside the platform aren't allowed — it protects you from later accusations and keeps taxes clean. Everything goes through the app.",
    },
    {
      id: "q5",
      scenario:
        "Mrs. Rowe just fell in the bathroom. She says she's fine but is shaky.",
      choices: [
        "Lift her back up quickly so she isn't embarrassed.",
        "Stay with her, keep her calm, call the family, and use the panic button if she seems hurt.",
        "Leave the room to get water.",
        "Text your friend for advice.",
      ],
      correct_index: 1,
      explanation:
        "Never lift alone — you can make an unseen injury worse. Stay, assess, contact family, and escalate if anything feels off.",
    },
    {
      id: "q6",
      scenario:
        "Mr. Brown asks for your personal cell number 'in case he needs to reach you between visits.'",
      choices: [
        "Give it to him — he seems lonely.",
        "Say no, and tell him he can reach you through the CareMatch app.",
        "Give him a fake number.",
        "Block his family and give him the number.",
      ],
      correct_index: 1,
      explanation:
        "Personal contact info stays personal. All communication goes through the app — it protects the senior, the family, and you.",
    },
    {
      id: "q7",
      scenario:
        "Mrs. Ferris is having trouble getting up from her armchair and asks you to pull her up by the arm.",
      choices: [
        "Help pull her up — she's struggling and you want to be helpful.",
        "Decline, let her take her own time, and note the difficulty in your check-out summary.",
        "Help this one time since no one's watching.",
        "Push the chair to make it easier for her to stand on her own.",
      ],
      correct_index: 1,
      explanation:
        "Physically assisting a transfer — chair, bed, or toilet — is hands-on care outside companion scope, and if she's injured during an assisted transfer, you're the one personally liable, not CareMatch. Note it so the family can arrange the right level of help.",
    },
  ],
};

// Server-only: correct answer key. Do not import from client code.
export function scoreAnswers(module: Module, answers: Record<string, number>): {
  score: number;
  total: number;
  passed: boolean;
  results: { id: string; correct: boolean; correct_index: number; explanation: string }[];
} {
  const results = module.questions.map((q) => {
    const given = answers[q.id];
    const correct = given === q.correct_index;
    return { id: q.id, correct, correct_index: q.correct_index, explanation: q.explanation };
  });
  const score = results.filter((r) => r.correct).length;
  return {
    score,
    total: module.questions.length,
    passed: score >= module.pass_threshold,
    results,
  };
}

// Client-safe view (strips correct answers + explanations).
export function toClientModule(m: Module) {
  return {
    code: m.code,
    title: m.title,
    intro: m.intro,
    pass_threshold: m.pass_threshold,
    lessons: m.lessons,
    questions: m.questions.map((q) => ({
      id: q.id,
      scenario: q.scenario,
      choices: q.choices,
    })),
  };
}

export type ClientModule = ReturnType<typeof toClientModule>;
