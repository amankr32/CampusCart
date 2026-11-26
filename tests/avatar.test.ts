import { describe, expect, it } from "vitest";
import { getAvatarInitials } from "@/lib/avatar";

describe("getAvatarInitials", () => {
  it("returns first letter of first name and first letter of last name when both exist", () => {
    expect(getAvatarInitials("Aman Kumar")).toBe("AK");
    expect(getAvatarInitials("  rohan   sharma  ")).toBe("RS");
    expect(getAvatarInitials("Aman Singh Verma")).toBe("AV");
  });

  it("returns only the first letter when only a single name is present", () => {
    expect(getAvatarInitials("Aman")).toBe("A");
    expect(getAvatarInitials("  priya  ")).toBe("P");
  });

  it("returns the fallback when name is empty or missing", () => {
    expect(getAvatarInitials("")).toBe("CC");
    expect(getAvatarInitials("   ")).toBe("CC");
    expect(getAvatarInitials(null, "U")).toBe("U");
    expect(getAvatarInitials(undefined, "ST")).toBe("ST");
  });
});
