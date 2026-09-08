import { compareOutput, normalise } from "../src/controllers/executeController.js";

describe("compareOutput", () => {
  test("matches exact strings", () => {
    expect(compareOutput("hello", "hello")).toBe(true);
    expect(compareOutput("42", "42")).toBe(true);
  });

  test("handles empty and null values gracefully", () => {
    expect(compareOutput("", "")).toBe(true);
    expect(compareOutput(null, null)).toBe(true);
    expect(compareOutput(undefined, undefined)).toBe(true);
    expect(compareOutput("hello", "")).toBe(false);
    expect(compareOutput("", "hello")).toBe(false);
  });

  test("ignores surrounding and inner whitespace for array formats", () => {
    expect(compareOutput("[0,1]", "[0, 1]")).toBe(true);
    expect(compareOutput("[ 0 , 1 ]\n", "[0,1]")).toBe(true);
    expect(compareOutput('["o","l","l","e","h"]', '["o", "l", "l", "e", "h"]')).toBe(true);
  });

  test("matches booleans regardless of Python vs JS case", () => {
    expect(compareOutput("true", "True")).toBe(true);
    expect(compareOutput("false", "False")).toBe(true);
    expect(compareOutput("True", "true")).toBe(true);
  });

  test("compares parsed JSON objects and arrays", () => {
    expect(compareOutput('{"a": 1, "b": 2}', '{"b": 2, "a": 1}')).toBe(true);
    expect(compareOutput("[1, 2, 3]", "[1,2,3]")).toBe(true);
    expect(compareOutput("[1, 2, 3]", "[1, 2, 4]")).toBe(false);
  });

  test("compares floating point numbers with tolerance", () => {
    expect(compareOutput("3.14159265", "3.141592")).toBe(true);
    expect(compareOutput("2.00000", "2")).toBe(true);
    expect(compareOutput("10.5", "11.5")).toBe(false);
  });
});

describe("normalise", () => {
  test("replaces Windows CRLF with LF and trims whitespace", () => {
    expect(normalise("line1\r\nline2\r\n ")).toBe("line1\nline2");
    expect(normalise("  hello world  \n")).toBe("hello world");
    expect(normalise(null)).toBe("");
  });
});
