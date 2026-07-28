import { describe, expect, it } from "vitest";
import { COMPANION_BASICS_V1, scoreAnswers, toClientModule } from "./provider-training-content";

describe("scoreAnswers", () => {
  it("passes when every answer is correct", () => {
    const allCorrect = Object.fromEntries(
      COMPANION_BASICS_V1.questions.map((q) => [q.id, q.correct_index]),
    );
    const result = scoreAnswers(COMPANION_BASICS_V1, allCorrect);
    expect(result.score).toBe(COMPANION_BASICS_V1.questions.length);
    expect(result.passed).toBe(true);
    expect(result.results.every((r) => r.correct)).toBe(true);
  });

  it("fails when every answer is wrong", () => {
    const allWrong = Object.fromEntries(
      COMPANION_BASICS_V1.questions.map((q) => [q.id, (q.correct_index + 1) % q.choices.length]),
    );
    const result = scoreAnswers(COMPANION_BASICS_V1, allWrong);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("treats a missing answer as incorrect rather than throwing", () => {
    const result = scoreAnswers(COMPANION_BASICS_V1, {});
    expect(result.score).toBe(0);
    expect(result.total).toBe(COMPANION_BASICS_V1.questions.length);
  });

  it("passes exactly at the pass_threshold, not one below it", () => {
    const threshold = COMPANION_BASICS_V1.pass_threshold;
    const answers: Record<string, number> = {};
    COMPANION_BASICS_V1.questions.forEach((q, i) => {
      answers[q.id] = i < threshold ? q.correct_index : (q.correct_index + 1) % q.choices.length;
    });
    const atThreshold = scoreAnswers(COMPANION_BASICS_V1, answers);
    expect(atThreshold.score).toBe(threshold);
    expect(atThreshold.passed).toBe(true);

    const oneShort = { ...answers };
    const lastCorrectId = COMPANION_BASICS_V1.questions[threshold - 1].id;
    oneShort[lastCorrectId] =
      (COMPANION_BASICS_V1.questions[threshold - 1].correct_index + 1) %
      COMPANION_BASICS_V1.questions[threshold - 1].choices.length;
    const belowThreshold = scoreAnswers(COMPANION_BASICS_V1, oneShort);
    expect(belowThreshold.score).toBe(threshold - 1);
    expect(belowThreshold.passed).toBe(false);
  });
});

describe("toClientModule", () => {
  it("never leaks correct_index or explanation to the client view", () => {
    const client = toClientModule(COMPANION_BASICS_V1);
    for (const q of client.questions) {
      expect(q).not.toHaveProperty("correct_index");
      expect(q).not.toHaveProperty("explanation");
    }
  });

  it("preserves every question's scenario and choices for display", () => {
    const client = toClientModule(COMPANION_BASICS_V1);
    expect(client.questions).toHaveLength(COMPANION_BASICS_V1.questions.length);
    client.questions.forEach((q, i) => {
      expect(q.scenario).toBe(COMPANION_BASICS_V1.questions[i].scenario);
      expect(q.choices).toEqual(COMPANION_BASICS_V1.questions[i].choices);
    });
  });
});
