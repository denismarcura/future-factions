import { describe, it, expect } from "vitest";
import { parseInstagramHandles } from "./instagram-handles";

const handles = (input: string) =>
  parseInstagramHandles(input).valid.map((v) => v.handle);
const reasons = (input: string) =>
  parseInstagramHandles(input).invalid.map((i) => ({ token: i.token, reason: i.reason }));

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
    expect(handles("casadinapoli")).toEqual(["casadinapoli"]);
  });

  it("splits by newline, comma, semicolon, whitespace", () => {
    expect(handles("@a\n@b")).toEqual(["a", "b"]);
    expect(handles("@a,@b , @c")).toEqual(["a", "b", "c"]);
    expect(handles("@a;@b;;@c")).toEqual(["a", "b", "c"]);
    expect(handles("@a   @b\t@c\n,;  @d")).toEqual(["a", "b", "c", "d"]);
  });

  it("extracts handles from full URLs", () => {
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

  it("dedupes case-insensitively and reports duplicates with reason", () => {
    const input = "@Casa, casa; https://instagram.com/CASA/\n@casa";
    const { valid, invalid } = parseInstagramHandles(input);
    expect(valid).toHaveLength(1);
    expect(valid[0].handle).toBe("Casa");
    expect(invalid.every((i) => i.reason === "duplicated")).toBe(true);
    expect(invalid).toHaveLength(3);
  });

  it("strips multiple leading @", () => {
    expect(handles("@@@user")).toEqual(["user"]);
  });

  it("flags invalid characters with reason 'invalid_chars'", () => {
    expect(reasons("bad-name!")).toEqual([{ token: "bad-name!", reason: "invalid_chars" }]);
  });

  it("flags too-long handles with reason 'too_long'", () => {
    const longName = "a".repeat(31);
    expect(reasons(longName)).toEqual([{ token: longName, reason: "too_long" }]);
  });

  it("flags reserved paths (post/reel URLs) with reason 'reserved'", () => {
    const input = "https://instagram.com/p/ABC123/, https://instagram.com/reel/xyz/";
    const r = reasons(input);
    expect(r).toEqual([
      { token: "https://instagram.com/p/ABC123/", reason: "reserved" },
      { token: "https://instagram.com/reel/xyz/", reason: "reserved" },
    ]);
  });

  it("accepts dots and underscores in handle", () => {
    expect(handles("@user.name_01")).toEqual(["user.name_01"]);
  });

  it("handles mixed valid and invalid in same input", () => {
    const { valid, invalid } = parseInstagramHandles("@ok, !!, @ok2, @ok");
    expect(valid.map((v) => v.handle)).toEqual(["ok", "ok2"]);
    expect(invalid).toEqual([
      { token: "!!", reason: "invalid_chars", message: expect.any(String) },
      { token: "@ok", reason: "duplicated", message: expect.any(String) },
    ]);
  });

  it("attaches a human-readable message to every rejection", () => {
    const { invalid } = parseInstagramHandles("bad-name!");
    expect(invalid[0].message).toMatch(/caracteres inválidos/);
  });
});
