// Code execution goes: Browser → Your Backend → Judge0 CE
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * @param {string} language - "javascript" | "python" | "java"
 * @param {string} code - source code to execute
 * @param {Array<{input:string, rawInput?:string, expected:string, label:string}>} [testCases] - optional test cases
 * @param {object} [metaData] - LeetCode problem metaData containing function name and types
 * @returns {Promise<object>}
 */
export async function executeCode(language, code, testCases, metaData) {
  try {
    const res = await fetch(`${API_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, testCases, metaData }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: `Request failed: ${err.message}` };
  }
}
