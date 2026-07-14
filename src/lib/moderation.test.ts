import { describe, it, expect } from "vitest";
import { checkContent, decideInitialStatus } from "./moderation";

describe("checkContent — clean content", () => {
  it("passes a heartfelt tribute", () => {
    const d = checkContent(
      "Thank you for your courage. Your sacrifice will always be remembered by our family.",
    );
    expect(d.clean).toBe(true);
    expect(d.categories).toEqual([]);
  });

  it("does NOT flag ordinary war vocabulary (this is a war-memorial site)", () => {
    // kill/killed, die, death, blood, bomb, enemy, attack, fight, war all appear.
    const d = checkContent(
      "You gave your life fighting the enemy. Amid the bombs and blood you killed fear itself; your death in that war was not in vain.",
    );
    expect(d.clean).toBe(true);
  });

  it("does not fall for the Scunthorpe problem (word-only stems)", () => {
    for (const s of [
      "Our class studied your bravery.",
      "She is a therapist who admires you.",
      "The assassin could not break your resolve.",
      "We planted a grape vine in your memory.",
      "This flame retardant jacket reminds me of your unit.",
      "A careful analysis of the battle shows your genius.",
    ]) {
      expect(checkContent(s).clean, s).toBe(true);
    }
  });
});

describe("checkContent — profanity & evasion", () => {
  it("flags plain profanity", () => {
    expect(checkContent("this is fucking terrible").categories).toContain(
      "profanity",
    );
    expect(checkContent("what a piece of shit").categories).toContain(
      "profanity",
    );
  });

  it("flags leetspeak evasion", () => {
    expect(checkContent("sh1t happens").categories).toContain("profanity");
    expect(checkContent("you @sshole").categories).toContain("profanity");
    expect(checkContent("fu(k this").categories).toContain("profanity");
    expect(checkContent("what a b1tch").categories).toContain("profanity");
  });

  it("flags repeated-character evasion", () => {
    expect(checkContent("fuuuuck").categories).toContain("profanity");
    expect(checkContent("shiiiit").categories).toContain("profanity");
  });

  it("flags letter-spacing evasion", () => {
    expect(checkContent("f u c k this").categories).toContain("profanity");
    expect(checkContent("s.h.i.t").categories).toContain("profanity");
  });

  it("word-only stems flag when standalone", () => {
    expect(checkContent("you are an ass").categories).toContain("profanity");
  });
});

describe("checkContent — hate, spam, contact", () => {
  it("flags hateful slurs", () => {
    expect(checkContent("you retard").categories).toContain("hate");
  });

  it("flags harassment / self-harm phrases but not war narrative", () => {
    expect(checkContent("go kill yourself").categories).toContain("violence");
    // 'killed the enemy' must NOT be violence
    expect(checkContent("you killed the enemy bravely").clean).toBe(true);
  });

  it("flags links as spam", () => {
    expect(checkContent("visit http://spam.example now").categories).toContain(
      "spam",
    );
    expect(checkContent("go to www.buythings.com").categories).toContain(
      "spam",
    );
    expect(checkContent("check spammy.xyz/deal").categories).toContain("spam");
  });

  it("flags emails and phone numbers as contact", () => {
    expect(checkContent("email me at test@example.com").categories).toContain(
      "contact",
    );
    expect(checkContent("call 9876543210").categories).toContain("contact");
  });

  it("flags excessive shouting", () => {
    expect(
      checkContent("THIS IS A VERY LOUD SHOUTING SPAM MESSAGE").categories,
    ).toContain("spam");
  });

  it("flags promotional phrases", () => {
    expect(checkContent("click here to buy now").categories).toContain("spam");
  });
});

describe("decideInitialStatus", () => {
  const clean = checkContent("a lovely clean message of thanks");
  const flagged = checkContent("this is fucking spam http://x.com");

  it("auto-approves clean content when human review is not forced", () => {
    expect(decideInitialStatus(clean, false)).toBe("approved");
  });

  it("holds clean content when human review IS forced", () => {
    expect(decideInitialStatus(clean, true)).toBe("pending");
  });

  it("always holds flagged content for review", () => {
    expect(decideInitialStatus(flagged, false)).toBe("pending");
    expect(decideInitialStatus(flagged, true)).toBe("pending");
  });

  it("flagged content is never auto-approved (priority #1)", () => {
    expect(flagged.clean).toBe(false);
    expect(decideInitialStatus(flagged, false)).not.toBe("approved");
  });
});
