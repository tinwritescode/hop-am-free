import { describe, expect, it } from "vitest";
import { backButtonVisible, createBackStack } from "./back";

describe("backButtonVisible", () => {
  it("hides Telegram's back button on the home page only", () => {
    expect(backButtonVisible("/")).toBe(false);
    expect(backButtonVisible("/bai-hat/de-no-den")).toBe(true);
    expect(backButtonVisible("/agents")).toBe(true);
    expect(backButtonVisible("/bai-hat")).toBe(true);
    expect(backButtonVisible("/ca-si")).toBe(true);
  });
});

describe("createBackStack", () => {
  it("goes home when the Mini App opened straight on this page (e.g. a shared song link)", () => {
    const stack = createBackStack();
    stack.visit();
    expect(stack.back()).toBe("home");
  });

  it("goes back through pages visited inside the Mini App, then home", () => {
    const stack = createBackStack();
    stack.visit(); // landed on a song
    stack.visit(); // opened another song
    stack.visit(); // and the agents page
    expect(stack.back()).toBe("history");
    stack.visit(); // the router lands on the previous song
    expect(stack.back()).toBe("history");
    stack.visit(); // the first song
    expect(stack.back()).toBe("home");
  });

  it("starts over at home after falling back to it", () => {
    const stack = createBackStack();
    stack.visit();
    expect(stack.back()).toBe("home");
    stack.visit(); // home replaced the landing page
    stack.visit(); // then a song
    expect(stack.back()).toBe("history");
    stack.visit();
    expect(stack.back()).toBe("home");
  });
});
