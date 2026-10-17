import { describe, it, expect } from "vitest";
import { resolveDatabaseUrl, shouldUseNeonServerless } from "@/lib/db-config";

describe("Database Connection URL Resolver", () => {
  it("converts a Neon direct endpoint into a pooled endpoint", () => {
    const directUrl =
      "postgresql://neondb_owner:npg_secret123@ep-cold-cherry-azaahbyy.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    const resolved = resolveDatabaseUrl(directUrl);

    expect(resolved).toBe(
      "postgresql://neondb_owner:npg_secret123@ep-cold-cherry-azaahbyy-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    );
  });

  it("leaves an already pooled Neon endpoint unchanged", () => {
    const pooledUrl =
      "postgresql://neondb_owner:npg_secret123@ep-cold-cherry-azaahbyy-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    const resolved = resolveDatabaseUrl(pooledUrl);

    expect(resolved).toBe(pooledUrl);
  });

  it("leaves localhost / standard PostgreSQL connections unchanged", () => {
    const localUrl = "postgresql://postgres:postgres@localhost:5432/campuscart";
    expect(resolveDatabaseUrl(localUrl)).toBe(localUrl);
  });

  it("leaves external non-Neon cloud databases unchanged", () => {
    const rdsUrl = "postgresql://user:pass@db.example.rds.amazonaws.com:5432/campusdb";
    expect(resolveDatabaseUrl(rdsUrl)).toBe(rdsUrl);
  });

  it("handles empty or falsy strings gracefully", () => {
    expect(resolveDatabaseUrl("")).toBe("");
  });
});

describe("Serverless Neon Driver Selector", () => {
  const neonUrl =
    "postgresql://neondb_owner:secret@ep-cold-cherry-azaahbyy-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb";
  const localUrl = "postgresql://postgres:postgres@localhost:5432/campuscart";

  it("activates Neon serverless HTTP driver when VERCEL environment is present", () => {
    expect(shouldUseNeonServerless({ VERCEL: "1" }, neonUrl)).toBe(true);
  });

  it("activates Neon serverless HTTP driver when AWS_LAMBDA_FUNCTION_NAME is present", () => {
    expect(
      shouldUseNeonServerless({ AWS_LAMBDA_FUNCTION_NAME: "my-fn" }, neonUrl)
    ).toBe(true);
  });

  it("activates Neon serverless HTTP driver when USE_NEON_SERVERLESS flag is set", () => {
    expect(
      shouldUseNeonServerless({ USE_NEON_SERVERLESS: "true" }, neonUrl)
    ).toBe(true);
  });

  it("does not activate Neon serverless HTTP driver in standard local environment", () => {
    expect(shouldUseNeonServerless({}, neonUrl)).toBe(false);
  });

  it("does not activate Neon serverless HTTP driver for non-Neon databases", () => {
    expect(shouldUseNeonServerless({ VERCEL: "1" }, localUrl)).toBe(false);
  });
});
