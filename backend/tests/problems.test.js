import {
  LOCAL_PROBLEMS,
  getFilteredLocalProblems,
  parseExamplesFromHtml,
} from "../src/controllers/problemsController.js";

describe("getFilteredLocalProblems", () => {
  test("returns all local problems with default parameters", () => {
    const result = getFilteredLocalProblems(50, 0);
    expect(result.total).toBe(LOCAL_PROBLEMS.length);
    expect(result.count).toBe(LOCAL_PROBLEMS.length);
    expect(result.problems.length).toBe(LOCAL_PROBLEMS.length);
  });

  test("filters correctly by difficulty", () => {
    const easy = getFilteredLocalProblems(50, 0, "Easy");
    expect(easy.problems.every((p) => p.difficulty === "Easy")).toBe(true);
    expect(easy.problems.length).toBeGreaterThan(0);

    const medium = getFilteredLocalProblems(50, 0, "Medium");
    expect(medium.problems.every((p) => p.difficulty === "Medium")).toBe(true);

    const hard = getFilteredLocalProblems(50, 0, "Hard");
    expect(hard.problems.every((p) => p.difficulty === "Hard")).toBe(true);
  });

  test("handles pagination limits and skips", () => {
    const page1 = getFilteredLocalProblems(2, 0);
    expect(page1.problems.length).toBe(2);
    expect(page1.problems[0].id).toBe(LOCAL_PROBLEMS[0].id);

    const page2 = getFilteredLocalProblems(2, 2);
    expect(page2.problems.length).toBe(2);
    expect(page2.problems[0].id).toBe(LOCAL_PROBLEMS[2].id);
  });

  test("filters correctly by category tags", () => {
    const arrayProblems = getFilteredLocalProblems(50, 0, undefined, "Array");
    expect(arrayProblems.problems.every((p) => p.category.includes("Array"))).toBe(true);
  });
});

describe("parseExamplesFromHtml", () => {
  test("extracts inputs and outputs from standard preformatted html blocks", () => {
    const html = `
      <pre>
        <strong>Input:</strong> nums = [2,7,11,15], target = 9
        <strong>Output:</strong> [0,1]
        <strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
      </pre>
    `;

    const parsed = parseExamplesFromHtml(html);
    expect(parsed.length).toBe(1);
    expect(parsed[0].input).toContain("nums = [2,7,11,15], target = 9");
    expect(parsed[0].output).toContain("[0,1]");
    expect(parsed[0].explanation).toContain("Because nums[0] + nums[1] == 9");
  });

  test("extracts inputs and outputs from example-block div structure", () => {
    const html = `
      <div class="example-block">
        <p>Input: s = "anagram", t = "nagaram"</p>
        <p>Output: true</p>
      </div>
    `;

    const parsed = parseExamplesFromHtml(html);
    expect(parsed.length).toBe(1);
    expect(parsed[0].input).toBe('s = "anagram", t = "nagaram"');
    expect(parsed[0].output).toBe("true");
  });

  test("falls back to exampleTestcaseList if html is empty", () => {
    const fallbackList = ["[2,7,11,15]\n9", "[3,2,4]\n6"];
    const parsed = parseExamplesFromHtml("", fallbackList);
    expect(parsed.length).toBe(2);
    expect(parsed[0].input).toBe("[2,7,11,15]\n9");
    expect(parsed[1].input).toBe("[3,2,4]\n6");
  });
});
