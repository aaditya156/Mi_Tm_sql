import { ENV } from "../lib/env.js";

const LEETCODE_API = "https://alfa-leetcode-api.onrender.com";
const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const LEETCODE_HEADERS = {
  "Content-Type": "application/json",
  "Referer": "https://leetcode.com",
  "Origin": "https://leetcode.com",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

// Built-in curated problems list as a reliable fallback when external APIs fail/block cloud IPs
export const LOCAL_PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    titleSlug: "two-sum",
    difficulty: "Easy",
    category: "Array • Hash Table",
    acRate: 58,
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    titleSlug: "reverse-string",
    difficulty: "Easy",
    category: "String • Two Pointers",
    acRate: 78,
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    titleSlug: "valid-palindrome",
    difficulty: "Easy",
    category: "String • Two Pointers",
    acRate: 48,
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    titleSlug: "maximum-subarray",
    difficulty: "Medium",
    category: "Array • Dynamic Programming",
    acRate: 51,
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    titleSlug: "container-with-most-water",
    difficulty: "Medium",
    category: "Array • Two Pointers",
    acRate: 55,
  },
  {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    titleSlug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    category: "Hash Table • String • Sliding Window",
    acRate: 40,
  },
  {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    titleSlug: "median-of-two-sorted-arrays",
    difficulty: "Hard",
    category: "Array • Binary Search • Divide and Conquer",
    acRate: 47,
  },
  {
    id: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    titleSlug: "longest-palindromic-substring",
    difficulty: "Medium",
    category: "String • Dynamic Programming",
    acRate: 38,
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    titleSlug: "valid-parentheses",
    difficulty: "Easy",
    category: "String • Stack",
    acRate: 41,
  },
  {
    id: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    titleSlug: "merge-two-sorted-lists",
    difficulty: "Easy",
    category: "Linked List • Recursion",
    acRate: 64,
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    titleSlug: "climbing-stairs",
    difficulty: "Easy",
    category: "Math • Dynamic Programming • Memoization",
    acRate: 53,
  },
  {
    id: "3sum",
    title: "3Sum",
    titleSlug: "3sum",
    difficulty: "Medium",
    category: "Array • Two Pointers • Sorting",
    acRate: 36,
  },
  {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    titleSlug: "search-in-rotated-sorted-array",
    difficulty: "Medium",
    category: "Array • Binary Search",
    acRate: 42,
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    titleSlug: "trapping-rain-water",
    difficulty: "Hard",
    category: "Array • Two Pointers • Dynamic Programming • Stack",
    acRate: 63,
  },
  {
    id: "invert-binary-tree",
    title: "Invert Binary Tree",
    titleSlug: "invert-binary-tree",
    difficulty: "Easy",
    category: "Tree • Depth-First Search • Breadth-First Search • Binary Tree",
    acRate: 77,
  },
];

// Helper to filter local problem set
export function getFilteredLocalProblems(limit, skip, difficulty, tags) {
  let filtered = [...LOCAL_PROBLEMS];
  if (difficulty) {
    filtered = filtered.filter(
      (p) => p.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }
  if (tags) {
    filtered = filtered.filter((p) =>
      p.category.toLowerCase().includes(tags.toLowerCase())
    );
  }
  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  return {
    total,
    count: paginated.length,
    problems: paginated,
  };
}

// GET /api/problems?limit=50&skip=0&difficulty=Easy&tags=array
export async function getProblemsController(req, res) {
  const { limit = 50, skip = 0, difficulty, tags } = req.query;
  const parsedLimit = parseInt(limit, 10) || 50;
  const parsedSkip = parseInt(skip, 10) || 0;

  // --- TIER 1: Direct LeetCode GraphQL ---
  const filters = {};
  if (difficulty) {
    filters.difficulty = difficulty.toUpperCase();
  }
  if (tags) {
    filters.tags = [tags];
  }

  const query = {
    operationName: "problemsetQuestionList",
    variables: {
      categorySlug: "",
      limit: parsedLimit,
      skip: parsedSkip,
      filters,
    },
    query: `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          acRate
          difficulty
          frontendQuestionId: questionFrontendId
          isPaidOnly
          title
          titleSlug
          topicTags {
            name
            slug
          }
        }
      }
    }`,
  };

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: LEETCODE_HEADERS,
      body: JSON.stringify(query),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const json = await response.json();
      const data = json?.data?.problemsetQuestionList;
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        const problems = data.questions
          .filter((p) => !p.isPaidOnly)
          .map((p) => ({
            id: p.titleSlug,
            title: p.title,
            titleSlug: p.titleSlug,
            difficulty: p.difficulty,
            category: p.topicTags?.map((t) => t.name).join(" • ") || "",
            acRate: Math.round(p.acRate || 0),
          }));

        return res.json({
          total: data.total || problems.length,
          count: problems.length,
          problems,
        });
      }
    }
  } catch (err) {
    console.warn("Direct LeetCode GraphQL failed, trying Alfa API:", err.message);
  }

  // --- TIER 2: Secondary Proxy API (alfa-leetcode-api) ---
  try {
    const alfaParams = new URLSearchParams({
      limit: String(parsedLimit),
      skip: String(parsedSkip),
    });
    const alfaRes = await fetch(`${LEETCODE_API}/problems?${alfaParams}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (alfaRes.ok) {
      const alfaData = await alfaRes.json();
      const rawList = alfaData?.problemsetQuestionList || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        let problems = rawList
          .filter((p) => !p.isPaidOnly)
          .map((p) => ({
            id: p.titleSlug,
            title: p.title,
            titleSlug: p.titleSlug,
            difficulty: p.difficulty,
            category: p.topicTags?.map((t) => t.name).join(" • ") || "",
            acRate: Math.round(p.acRate || 0),
          }));

        if (difficulty) {
          problems = problems.filter(
            (p) => p.difficulty.toLowerCase() === difficulty.toLowerCase()
          );
        }

        return res.json({
          total: alfaData.totalQuestions || problems.length,
          count: problems.length,
          problems,
        });
      }
    }
  } catch (err) {
    console.warn("Alfa LeetCode API failed, falling back to local problem catalog:", err.message);
  }

  // --- TIER 3: Local Curated Catalog Fallback ---
  const fallback = getFilteredLocalProblems(parsedLimit, parsedSkip, difficulty, tags);
  return res.json(fallback);
}


// Fetch complete problem data directly from LeetCode's GraphQL API
async function fetchLeetCodeQuestionData(titleSlug) {
  const query = {
    operationName: "questionData",
    variables: { titleSlug },
    query: `query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        content
        difficulty
        sampleTestCase
        exampleTestcaseList
        metaData
        hints
        topicTags {
          name
          slug
        }
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }`,
  };

  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: LEETCODE_HEADERS,
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) throw new Error(`LeetCode GraphQL error: ${res.status}`);
  const json = await res.json();
  return json?.data?.question || null;
}

// Parse raw example testcases and HTML description into structured array of test cases
export function parseExamplesFromHtml(html, exampleTestcaseList = []) {
  if (!html) {
    return (exampleTestcaseList || []).map((raw, i) => ({
      label: `Example ${i + 1}`,
      input: raw,
      output: "",
      explanation: "",
      rawInput: raw,
    }));
  }

  const cleanHtml = html
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "\x27");

  const extracted = [];

  // Strategy 1: Match example blocks (div class="example-block" or pre)
  const blockRegex = /<(?:div\s+class="example-block"|pre)[^>]*>([\s\S]*?)<\/(?:div|pre)>/gi;
  let match;
  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const inputMatch = text.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
    const outputMatch = text.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
    const explanationMatch = text.match(/Explanation:\s*([\s\S]*?)$/i);

    if (inputMatch && outputMatch) {
      extracted.push({
        input: inputMatch[1].trim(),
        output: outputMatch[1].trim(),
        explanation: explanationMatch ? explanationMatch[1].trim() : "",
      });
    }
  }

  // Strategy 2: If no blocks found, search for plain Input: ... Output: ... pairs
  if (extracted.length === 0) {
    const pairRegex = /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=(?:Input:|Explanation:|Constraints:|$))/gi;
    const stripped = cleanHtml.replace(/<[^>]+>/g, "\n");
    while ((match = pairRegex.exec(stripped)) !== null) {
      extracted.push({
        input: match[1].trim(),
        output: match[2].trim(),
        explanation: "",
      });
    }
  }

  // Combine with exampleTestcaseList
  if (extracted.length === 0 && exampleTestcaseList && exampleTestcaseList.length > 0) {
    return exampleTestcaseList.map((raw, i) => ({
      label: `Example ${i + 1}`,
      input: raw,
      output: "",
      explanation: "",
      rawInput: raw,
    }));
  }

  return extracted.map((ex, i) => ({
    label: `Example ${i + 1}`,
    input: ex.input,
    output: ex.output,
    explanation: ex.explanation,
    rawInput: (exampleTestcaseList && exampleTestcaseList[i]) ? exampleTestcaseList[i] : ex.input,
  }));
}

// GET /api/problems/:slug
export async function getProblemBySlugController(req, res) {
  const { slug } = req.params;

  try {
    let question = null;
    try {
      question = await fetchLeetCodeQuestionData(slug);
    } catch (directErr) {
      console.warn("Direct questionData fetch failed for", slug, directErr.message);
    }

    if (!question) {
      // Fallback to alfa-leetcode-api if direct GraphQL question is empty
      const detailRes = await fetch(`${LEETCODE_API}/select?titleSlug=${slug}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!detailRes.ok) throw new Error(`Problem not found on Alfa API: ${slug}`);
      const data = await detailRes.json();
      return res.json({
        id: data.titleSlug || slug,
        title: data.questionTitle || slug,
        titleSlug: data.titleSlug || slug,
        difficulty: data.difficulty || "Medium",
        category: data.topicTags?.map((t) => t.name).join(" • ") || "",
        descriptionHtml: data.question || "",
        examples: parseExamplesFromHtml(data.question, []),
        hints: data.hints || [],
        codeSnippets: {},
        metaData: null,
      });
    }

    const codeSnippetsMap = {};
    (question.codeSnippets || []).forEach(({ langSlug, code }) => {
      codeSnippetsMap[langSlug] = code;
    });

    let parsedMetaData = null;
    if (question.metaData) {
      try {
        parsedMetaData = typeof question.metaData === "string" ? JSON.parse(question.metaData) : question.metaData;
      } catch {
        parsedMetaData = null;
      }
    }

    const examples = parseExamplesFromHtml(question.content, question.exampleTestcaseList);

    return res.json({
      id: question.titleSlug,
      title: question.title,
      titleSlug: question.titleSlug,
      difficulty: question.difficulty,
      category: question.topicTags?.map((t) => t.name).join(" • ") || "",
      descriptionHtml: question.content,
      examples,
      hints: question.hints || [],
      codeSnippets: codeSnippetsMap,
      metaData: parsedMetaData,
      sampleTestCase: question.sampleTestCase || "",
    });
  } catch (err) {
    return res.status(502).json({ error: `Failed to fetch problem: ${err.message}` });
  }
}


