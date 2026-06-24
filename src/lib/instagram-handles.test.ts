import { describe, it, expect } from "vitest";
import { parseInstagramHandles } from "./instagram-handles";

describe("parseInstagramHandles", () => {
  it("returns empty for empty/whitespace input", () => {
    expect(parseInstagramHandles("")).toEqual({ valid: [], invalid: [] });
    expect(parseInstagramHandles("   \n  ")).toEqual({ valid: [], invalid: [] });
  });

  it("parses a single @username", () => {
    const { valid, invalid } = parseInstagramHandles("@casadinapoli");
    expect(invalid).toEqual([]);
    expect(valid).toEqual([
      { handle: "casadinapoli", url: "https://www.instagram.com/casadinapoli/" },
    ]);
  });

  it("parses bare username without @", () => {
    const { valid } = parseInstagramHandles("casadinapoli");
    expect(valid.map((v) => v.handle)).toEqual(["casadinapoli"]);
  });

  it("splits by newline", () => {
    const { valid } = parseInstagramHandles("@a\n@b\n@c");
    expect(valid.map((v) => v.handle)).toEqual(["a", "b", "c"]);
  });

  it("splits by comma", () => {
    const { valid } = parseInstagramHandles("@a,@b , @c");
    expect(valid.map((v) => v.handle)).toEqual(["a", "b", "c"]);
  });

  it("splits by semicolon", () => {
    const { valid } = parseInstagramHandles("@a;@b;;@c");
    expect(valid.map((v) => v.handle)).toEqual(["a", "b", "c"]);
  });

  it("splits by mixed whitespace and separators", () => {
    const { valid } = parseInstagramHandles("@a   @b\t@c\n,;  @d");
    expect(valid.map((v) => v.handle)).toEqual(["a", "b", "c", "d"]);
  });

  it("extracts handles from full URLs (http/https/www, with or without trailing slash)", () => {
    const input = [
      "https://www.instagram.com/casadinapoli/",
      "http://instagram.com/another",
      "www.instagram.com/perfil3/",
      "instagram.com/perfil4",
    ].join("\n");
    const { valid, invalid } = parseInstagramHandles(input);
    expect(invalid).toEqual([]);
    expect(valid.map((v) => v.handle)).toEqual([
      "casadinapoli",
      "another",
      "perfil3",
      "perfil4",
    ]);
    expect(valid[0].url).toBe("https://www.instagram.com/casadinapoli/");
  });

  it("dedupes case-insensitively across formats", () => {
    const input = "@Casa, casa; https://instagram.com/CASA/\n@casa";
    const { valid } = parseInstagramHandles(input);
    expect(valid).toHaveLength(1);
    // Keeps the first occurrence's casing
    expect(valid[0].handle).toBe("Casa");
  });

  it("strips multiple leading @", () => {
    const { valid } = parseInstagramHandles("@@@user");
    expect(valid.map((v) => v.handle)).toEqual(["user"]);
  });

  it("flags invalid usernames (special chars, too long, reserved paths)", () => {
    const longName = "a".repeat(31);
    const input = `valid_user, bad-name!, ${longName}, https://instagram.com/p/ABC123/, https://instagram.com/reel/xyz/`;
    const { valid, invalid } = parseInstagramHandles(input);
    expect(valid.map((v) => v.handle)).toEqual(["valid_user"]);
    expect(invalid).toEqual([
      "bad-name!",
      longName,
      "https://instagram.com/p/ABC123/",
      "https://instagram.com/reel/xyz/",
    ]);
  });

  it("accepts dots and underscores in handle", () => {
    const { valid, invalid } = parseInstagramHandles("@user.name_01");
    expect(invalid).toEqual([]);
    expect(valid[0].handle).toBe("user.name_01");
  });

  it("handles mixed valid and invalid in same input", () => {
    const { valid, invalid } = parseInstagramHandles("@ok, !!, @ok2");
    expect(valid.map((v) => v.handle)).toEqual(["ok", "ok2"]);
    expect(invalid).toEqual(["!!"]);
  });
});
