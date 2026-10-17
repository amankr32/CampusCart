import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { MaterialSymbol, IconSearch, IconHeart, IconShieldCheck } from "@/components/ui/material-symbol";

describe("Google Material Symbols Component", () => {
  it("renders the symbol name as text content and applies base classes", () => {
    const { container } = render(<MaterialSymbol name="search" />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("search");
    expect(span?.classList.contains("material-symbols-rounded")).toBe(true);
  });

  it("applies filled class and font-variation-settings when filled is true", () => {
    const { container } = render(<MaterialSymbol name="favorite" filled />);
    const span = container.querySelector("span");
    expect(span?.classList.contains("filled")).toBe(true);
    expect(span?.getAttribute("style")).toContain("'FILL' 1");
  });

  it("sets numeric fontSize style when size prop is provided", () => {
    const { container } = render(<MaterialSymbol name="verified" size={28} />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("style")).toContain("28px");
  });

  it("renders typed pre-configured icon helpers correctly", () => {
    const { container: c1 } = render(<IconSearch className="w-5 h-5 text-indigo-600" />);
    expect(c1.querySelector("span")?.textContent).toBe("search");
    expect(c1.querySelector("span")?.className).toContain("text-indigo-600");

    const { container: c2 } = render(<IconHeart filled className="text-rose-500" />);
    expect(c2.querySelector("span")?.textContent).toBe("favorite");
    expect(c2.querySelector("span")?.classList.contains("filled")).toBe(true);

    const { container: c3 } = render(<IconShieldCheck className="text-emerald-500" />);
    expect(c3.querySelector("span")?.textContent).toBe("verified_user");
  });
});
