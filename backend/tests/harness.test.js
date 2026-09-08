import {
  buildJsHarness,
  buildPythonHarness,
  buildJavaHarness,
  wrapCodeForExecution,
} from "../src/controllers/executeController.js";

describe("buildJsHarness", () => {
  test("generates standard JS runner with arguments parsing", () => {
    const userCode = "function twoSum(nums, target) { return [0, 1]; }";
    const metaData = {
      name: "twoSum",
      params: [
        { name: "nums", type: "integer[]" },
        { name: "target", type: "integer" },
      ],
      return: { type: "integer[]" },
    };

    const harness = buildJsHarness(userCode, metaData);
    expect(harness).toContain(userCode);
    expect(harness).toContain('fs.readFileSync(0, "utf-8")');
    expect(harness).toContain("twoSum");
    expect(harness).toContain("formatResult");
  });

  test("generates in-place mutation serialization when paramindex is specified", () => {
    const userCode = "function reverseString(s) { s.reverse(); }";
    const metaData = {
      name: "reverseString",
      params: [{ name: "s", type: "character[]" }],
      output: { paramindex: 0 },
    };

    const harness = buildJsHarness(userCode, metaData);
    expect(harness).toContain("var outputIndex = 0;");
    expect(harness).toContain("formatResult(parsedArgs[outputIndex])");
  });

  test("includes ListNode helpers when ListNode types are used", () => {
    const userCode = "function mergeTwoLists(l1, l2) { return l1; }";
    const metaData = {
      name: "mergeTwoLists",
      params: [
        { name: "l1", type: "ListNode" },
        { name: "l2", type: "ListNode" },
      ],
      return: { type: "ListNode" },
    };

    const harness = buildJsHarness(userCode, metaData);
    expect(harness).toContain("function ListNode");
    expect(harness).toContain("arrayToListNode");
    expect(harness).toContain("listNodeToArray");
  });

  test("includes TreeNode helpers when TreeNode types are used", () => {
    const userCode = "function invertTree(root) { return root; }";
    const metaData = {
      name: "invertTree",
      params: [{ name: "root", type: "TreeNode" }],
      return: { type: "TreeNode" },
    };

    const harness = buildJsHarness(userCode, metaData);
    expect(harness).toContain("function TreeNode");
    expect(harness).toContain("arrayToTreeNode");
    expect(harness).toContain("treeNodeToArray");
  });
});

describe("buildPythonHarness", () => {
  test("generates Python stdin runner wrapping Solution class", () => {
    const userCode = `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        return [0, 1]`;
    const metaData = {
      name: "twoSum",
      params: [
        { name: "nums", type: "integer[]" },
        { name: "target", type: "integer" },
      ],
      return: { type: "integer[]" },
    };

    const harness = buildPythonHarness(userCode, metaData);
    expect(harness).toContain(userCode);
    expect(harness).toContain("sys.stdin.read().strip()");
    expect(harness).toContain("sol = Solution()");
    expect(harness).toContain("formatResult(res)");
  });

  test("includes Python TreeNode and ListNode deserializers", () => {
    const userCode = `class Solution:\n    def invertTree(self, root):\n        return root`;
    const metaData = {
      name: "invertTree",
      params: [{ name: "root", type: "TreeNode" }],
      return: { type: "TreeNode" },
    };

    const harness = buildPythonHarness(userCode, metaData);
    expect(harness).toContain("class TreeNode:");
    expect(harness).toContain("def arrayToTreeNode(arr):");
    expect(harness).toContain("def treeNodeToArray(root):");
    expect(harness).toContain("def arrayToListNode(arr):");
    expect(harness).toContain("def listNodeToArray(head):");
  });
});

describe("buildJavaHarness", () => {
  test("returns original code if public static void main is present", () => {
    const userCode = "public class Solution { public static void main(String[] args) {} }";
    const metaData = { name: "test" };
    expect(buildJavaHarness(userCode, metaData)).toBe(userCode);
  });

  test("generates Main class runner when given a Solution class", () => {
    const userCode = `class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; } }`;
    const metaData = {
      name: "twoSum",
      params: [
        { name: "nums", type: "integer[]" },
        { name: "target", type: "integer" },
      ],
      return: { type: "integer[]" },
    };

    const harness = buildJavaHarness(userCode, metaData);
    expect(harness).toContain("public class Main");
    expect(harness).toContain("Solution sol = new Solution()");
  });
});

describe("wrapCodeForExecution", () => {
  test("returns raw code if no metadata is provided", () => {
    const raw = "console.log('hello');";
    expect(wrapCodeForExecution("javascript", raw, null)).toBe(raw);
    expect(wrapCodeForExecution("python", raw, undefined)).toBe(raw);
  });
});
