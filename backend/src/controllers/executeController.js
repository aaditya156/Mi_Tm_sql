// Judge0 CE — free hosted instance, no API key required
// https://ce.judge0.com
const JUDGE0_URL = "https://ce.judge0.com";

// Judge0 language IDs
export const LANGUAGE_IDS = {
  javascript: 63,  // Node.js 12.14.0
  python:     71,  // Python 3.8.1
  java:       62,  // Java 13.0.1
};

/** Run one submission through Judge0 and return raw result */
async function runOnJudge0(languageId, sourceCode, stdin = "") {
  const response = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language_id: languageId, source_code: sourceCode, stdin: stdin || "" }),
  });
  if (!response.ok) throw new Error(`Judge0 HTTP ${response.status}`);
  return response.json();
}

/** Normalise output for display / fallback */
export function normalise(s) {
  return (s || "").replace(/\r\n/g, "\n").trim();
}

function isDeepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 === "number" && typeof obj2 === "number") {
    return Math.abs(obj1 - obj2) < 1e-5;
  }
  if (obj1 && obj2 && typeof obj1 === "object" && typeof obj2 === "object") {
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      return obj1.every((item, i) => isDeepEqual(item, obj2[i]));
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every((key) => Object.prototype.hasOwnProperty.call(obj2, key) && isDeepEqual(obj1[key], obj2[key]));
  }
  return false;
}

/** Robust comparison between actual program output and expected output */
export function compareOutput(actual, expected) {
  if (actual === expected) return true;
  if (!actual && !expected) return true;
  if (!actual || !expected) return false;

  const a = actual.trim();
  const e = expected.trim();
  if (a === e) return true;

  // Try JSON parsed deep comparison
  try {
    const jsonA = JSON.parse(a);
    const jsonE = JSON.parse(e);
    if (isDeepEqual(jsonA, jsonE)) return true;
  } catch {}

  // Normalized whitespace & lowercased comparison (for booleans, arrays like [0, 1] vs [0,1])
  const normA = a.replace(/\s+/g, "");
  const normE = e.replace(/\s+/g, "");
  if (normA.toLowerCase() === normE.toLowerCase()) return true;

  return false;
}

// ── Language Harness Builders ───────────────────────────────────────────────

export function buildJsHarness(userCode, metaData) {
  const meta = typeof metaData === "string" ? JSON.parse(metaData) : metaData;
  const fnName = meta && meta.name;
  if (!fnName) return userCode;

  const outputIndex = (meta && meta.output && meta.output.paramindex !== undefined) ? meta.output.paramindex : -1;
  const params = (meta && meta.params) || [];

  return `
${userCode}

var fs = require("fs");

function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}
function arrayToListNode(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    var head = new ListNode(arr[0]);
    var curr = head;
    for (var i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}
function listNodeToArray(head) {
    var arr = [];
    while (head) {
        arr.push(head.val);
        head = head.next;
    }
    return arr;
}

function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
}
function arrayToTreeNode(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    var root = new TreeNode(arr[0]);
    var queue = [root];
    var i = 1;
    while (queue.length > 0 && i < arr.length) {
        var curr = queue.shift();
        if (arr[i] !== null && arr[i] !== undefined) {
            curr.left = new TreeNode(arr[i]);
            queue.push(curr.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
            curr.right = new TreeNode(arr[i]);
            queue.push(curr.right);
        }
        i++;
    }
    return root;
}
function treeNodeToArray(root) {
    if (!root) return [];
    var result = [];
    var queue = [root];
    while (queue.length > 0) {
        var node = queue.shift();
        if (node) {
            result.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            result.push(null);
        }
    }
    while (result.length > 0 && result[result.length - 1] === null) {
        result.pop();
    }
    return result;
}

function formatResult(val) {
    if (val && typeof val === "object" && ("val" in val) && ("next" in val)) {
        return JSON.stringify(listNodeToArray(val));
    }
    if (val && typeof val === "object" && ("val" in val) && ("left" in val) && ("right" in val)) {
        return JSON.stringify(treeNodeToArray(val));
    }
    return JSON.stringify(val);
}

try {
    var raw = fs.readFileSync(0, "utf-8").trim();
    if (!raw) process.exit(0);

    var lines = raw.split("\\n").map(function(l) { return l.trim(); }).filter(Boolean);
    var params = ${JSON.stringify(params)};
    var parsedArgs = [];

    for (var i = 0; i < lines.length; i++) {
        var parsed;
        try {
            parsed = JSON.parse(lines[i]);
        } catch(e) {
            parsed = lines[i];
        }

        var paramType = (params[i] && params[i].type) || "";
        if (paramType === "ListNode" || paramType.indexOf("ListNode") !== -1) {
            parsed = arrayToListNode(parsed);
        } else if (paramType === "TreeNode" || paramType.indexOf("TreeNode") !== -1) {
            parsed = arrayToTreeNode(parsed);
        }
        parsedArgs.push(parsed);
    }

    var fn;
    if (typeof ${fnName} === "function") {
        fn = ${fnName};
    } else if (typeof Solution === "function") {
        var sol = new Solution();
        if (typeof sol["${fnName}"] === "function") {
            fn = sol["${fnName}"].bind(sol);
        }
    }

    if (!fn) {
        console.error("Function ${fnName} not found in solution.");
        process.exit(1);
    }

    var ret = fn.apply(null, parsedArgs);

    var outputIndex = ${outputIndex};
    if (outputIndex >= 0 && outputIndex < parsedArgs.length) {
        console.log(formatResult(parsedArgs[outputIndex]));
    } else {
        console.log(formatResult(ret));
    }
} catch (e) {
    console.error((e && e.message) || e);
    process.exit(1);
}
`;
}

export function buildPythonHarness(userCode, metaData) {
  const meta = typeof metaData === "string" ? JSON.parse(metaData) : metaData;
  const fnName = meta && meta.name;
  if (!fnName) return userCode;

  const outputIndex = (meta && meta.output && meta.output.paramindex !== undefined) ? meta.output.paramindex : -1;
  const params = (meta && meta.params) || [];

  return `import sys, json
from typing import *

# Helper structures
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def arrayToListNode(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for v in arr[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def listNodeToArray(head):
    arr = []
    while head:
        arr.append(head.val)
        head = head.next
    return arr

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def arrayToTreeNode(arr):
    if not arr: return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        curr = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            curr.left = TreeNode(arr[i])
            queue.append(curr.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            curr.right = TreeNode(arr[i])
            queue.append(curr.right)
        i += 1
    return root

def treeNodeToArray(root):
    if not root: return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

def formatResult(val):
    if isinstance(val, ListNode):
        return json.dumps(listNodeToArray(val), separators=(",", ":"))
    if isinstance(val, TreeNode):
        return json.dumps(treeNodeToArray(val), separators=(",", ":"))
    if isinstance(val, bool):
        return "true" if val else "false"
    return json.dumps(val, separators=(",", ":"))

${userCode}

raw_input = sys.stdin.read().strip()
if raw_input:
    lines = [l.strip() for l in raw_input.splitlines() if l.strip()]
    params_meta = ${JSON.stringify(params)}
    parsed_args = []
    for i, line in enumerate(lines):
        try:
            parsed = json.loads(line)
        except Exception:
            parsed = line
        ptype = params_meta[i].get("type", "") if i < len(params_meta) else ""
        if "ListNode" in ptype:
            parsed = arrayToListNode(parsed)
        elif "TreeNode" in ptype:
            parsed = arrayToTreeNode(parsed)
        parsed_args.append(parsed)

    sol = Solution()
    fn = getattr(sol, "${fnName}", None)
    if fn is None and "${fnName}" in globals():
        fn = globals()["${fnName}"]

    if fn is None:
        sys.stderr.write("Function ${fnName} not found in solution.\\n")
        sys.exit(1)

    res = fn(*parsed_args)
    output_idx = ${outputIndex}
    if output_idx >= 0 and output_idx < len(parsed_args):
        print(formatResult(parsed_args[output_idx]))
    else:
        print(formatResult(res))
`;
}

function generateJavaInvocations(fnName, params, outputIndex) {
  const argNames = [];
  let declarations = "";

  params.forEach((param, i) => {
    const pName = `arg${i}`;
    argNames.push(pName);
    const pType = param.type || "";

    if (pType === "integer[]" || pType.includes("int[]") || pType.includes("integer[]")) {
      declarations += `int[] ${pName} = parseToIntArray(lines.get(${i}));\n`;
    } else if (pType === "character[]" || pType.includes("char[]")) {
      declarations += `char[] ${pName} = parseToCharArray(lines.get(${i}));\n`;
    } else if (pType === "integer" || pType === "int") {
      declarations += `int ${pName} = Integer.parseInt(lines.get(${i}));\n`;
    } else if (pType === "string" || pType === "String") {
      declarations += `String ${pName} = parseToString(lines.get(${i}));\n`;
    } else if (pType === "boolean") {
      declarations += `boolean ${pName} = Boolean.parseBoolean(lines.get(${i}));\n`;
    } else if (pType === "double") {
      declarations += `double ${pName} = Double.parseDouble(lines.get(${i}));\n`;
    } else {
      declarations += `String ${pName} = lines.get(${i});\n`;
    }
  });

  const call = `sol.${fnName}(${argNames.join(", ")});`;
  if (outputIndex >= 0) {
    return `${declarations}\n${call}\nSystem.out.println(formatOutput(${argNames[outputIndex]}));`;
  } else {
    return `${declarations}\nvar res = ${call}\nSystem.out.println(formatOutput(res));`;
  }
}

export function buildJavaHarness(userCode, metaData) {
  if (userCode.includes("public static void main")) {
    return userCode;
  }

  const meta = typeof metaData === "string" ? JSON.parse(metaData) : metaData;
  const fnName = meta && meta.name;
  if (!fnName) return userCode;

  const params = (meta && meta.params) || [];
  const outputIndex = (meta && meta.output && meta.output.paramindex !== undefined) ? meta.output.paramindex : -1;

  return `
import java.util.*;
import java.io.*;

// Helper structures
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

${userCode}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            if (!line.trim().isEmpty()) {
                lines.add(line.trim());
            }
        }
        if (lines.isEmpty()) return;

        Solution sol = new Solution();
        ${generateJavaInvocations(fnName, params, outputIndex)}
    }

    private static int[] parseToIntArray(String s) {
        s = s.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);
        if (s.trim().isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = Integer.parseInt(parts[i].trim());
        }
        return res;
    }

    private static char[] parseToCharArray(String s) {
        s = s.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);
        if (s.trim().isEmpty()) return new char[0];
        String[] parts = s.split(",");
        char[] res = new char[parts.length];
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i].trim();
            if (p.startsWith("\\\"") && p.endsWith("\\\"") && p.length() >= 2) p = p.substring(1, p.length() - 1);
            if (p.startsWith("\x27") && p.endsWith("\x27") && p.length() >= 2) p = p.substring(1, p.length() - 1);
            res[i] = p.isEmpty() ? \x27 \x27 : p.charAt(0);
        }
        return res;
    }

    private static String parseToString(String s) {
        s = s.trim();
        if (s.startsWith("\\\"") && s.endsWith("\\\"") && s.length() >= 2) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    private static String formatOutput(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) {
            return Arrays.toString((int[]) obj).replace(" ", "");
        }
        if (obj instanceof char[]) {
            char[] arr = (char[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                sb.append("\\\"").append(arr[i]).append("\\\"");
                if (i < arr.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof String[]) {
            String[] arr = (String[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                sb.append("\\\"").append(arr[i]).append("\\\"");
                if (i < arr.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof boolean[]) {
            return Arrays.toString((boolean[]) obj).replace(" ", "");
        }
        if (obj instanceof Object[]) {
            return Arrays.deepToString((Object[]) obj).replace(" ", "");
        }
        if (obj instanceof ListNode) {
            List<Integer> list = new ArrayList<>();
            ListNode curr = (ListNode) obj;
            while (curr != null) {
                list.add(curr.val);
                curr = curr.next;
            }
            return list.toString().replace(" ", "");
        }
        return String.valueOf(obj);
    }
}
`;
}

export function wrapCodeForExecution(language, code, metaData) {
  if (!metaData) return code;
  if (language === "javascript") return buildJsHarness(code, metaData);
  if (language === "python") return buildPythonHarness(code, metaData);
  if (language === "java") return buildJavaHarness(code, metaData);
  return code;
}

/**
 * POST /api/execute
 * Body: { language, code, testCases?: [{ input, rawInput, expected, label }], metaData?: object }
 */
export async function executeCodeController(req, res) {
  const { language, code, testCases, metaData } = req.body;

  if (!language || !code) {
    return res.status(400).json({ success: false, error: "Language and code are required" });
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return res.status(400).json({ success: false, error: `Unsupported language: ${language}` });
  }

  // ── Per-test-case mode ─────────────────────────────────────────────────────
  if (Array.isArray(testCases) && testCases.length > 0) {
    try {
      const wrappedCode = wrapCodeForExecution(language, code, metaData);

      const results = await Promise.all(
        testCases.map(async ({ input, rawInput, expected, label }) => {
          const stdin = (rawInput !== undefined && rawInput !== null) ? rawInput : (input ?? "");
          const data = await runOnJudge0(languageId, wrappedCode, stdin);

          // Compile / runtime errors
          if (data.compile_output) {
            return { label, input: input || rawInput, expected, passed: false, error: normalise(data.compile_output), output: null };
          }
          if (data.stderr) {
            return { label, input: input || rawInput, expected, passed: false, error: normalise(data.stderr), output: null };
          }
          if (data.status?.id !== 3) {
            return {
              label, input: input || rawInput, expected, passed: false,
              error: data.status?.description || data.message || "Execution failed", output: null,
            };
          }

          const output = normalise(data.stdout);
          const passed = compareOutput(output, expected);
          return { label, input: input || rawInput, expected, output, passed, error: null };
        })
      );

      const allPassed = results.every((r) => r.passed);
      const passCount = results.filter((r) => r.passed).length;

      return res.json({
        success: allPassed,
        mode: "testcases",
        passCount,
        totalCount: results.length,
        results,
      });
    } catch (err) {
      return res.status(502).json({ success: false, error: `Could not reach Judge0: ${err.message}` });
    }
  }

  // ── Plain run (no test cases) ──────────────────────────────────────────────
  try {
    const wrappedCode = wrapCodeForExecution(language, code, metaData);
    const data = await runOnJudge0(languageId, wrappedCode);

    if (data.compile_output) return res.json({ success: false, error: data.compile_output });
    if (data.stderr)         return res.json({ success: false, error: data.stderr });
    if (data.status?.id !== 3) {
      return res.json({ success: false, error: data.message || data.status?.description || "Execution failed" });
    }

    return res.json({ success: true, mode: "plain", output: data.stdout || "No output" });
  } catch (err) {
    return res.status(502).json({ success: false, error: `Could not reach Judge0: ${err.message}` });
  }
}


