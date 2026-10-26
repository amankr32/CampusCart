import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";

describe("Web App Manifest (PWA)", () => {
  it("generates a valid PWA manifest object with required attributes", () => {
    const config = manifest();
    expect(config.name).toBe("CampusCart — IKGPTU Student Marketplace");
    expect(config.short_name).toBe("CampusCart");
    expect(config.display).toBe("standalone");
    expect(config.start_url).toBe("/");
    expect(config.theme_color).toBe("#4f46e5");
    expect(config.background_color).toBe("#0f172a");
    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThan(0);
  });
});
