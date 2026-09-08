import { PROBLEMS } from "../data/problems";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function fetchProblems({ limit = 50, skip = 0, difficulty, tags } = {}) {
  const params = new URLSearchParams({ limit, skip });
  if (difficulty) params.append("difficulty", difficulty);
  if (tags) params.append("tags", tags);

  try {
    const res = await fetch(`${API_URL}/problems?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.problems) && data.problems.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Backend problems fetch failed, using local catalog fallback:", err.message);
  }

  // Graceful client fallback to built-in PROBLEMS catalog
  const staticList = Object.values(PROBLEMS).map((p) => ({
    id: p.id,
    title: p.title,
    titleSlug: p.id,
    difficulty: p.difficulty,
    category: p.category,
    acRate: 55,
  }));

  let filtered = staticList;
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

  return {
    total: filtered.length,
    count: filtered.length,
    problems: filtered.slice(skip, skip + limit),
    isFallback: true,
  };
}

export async function fetchProblemBySlug(slug) {
  try {
    const res = await fetch(`${API_URL}/problems/${slug}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) return data;
    }
  } catch (err) {
    console.warn("Backend problem fetch failed, checking local catalog:", err.message);
  }

  const staticProblem = PROBLEMS[slug];
  if (staticProblem) {
    return {
      id: staticProblem.id,
      title: staticProblem.title,
      titleSlug: staticProblem.id,
      difficulty: staticProblem.difficulty,
      category: staticProblem.category,
      descriptionHtml: `<p>${staticProblem.description?.text || ""}</p>`,
      examples: (staticProblem.examples || []).map((ex, i) => ({
        label: `Example ${i + 1}`,
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation || "",
        rawInput: ex.input,
      })),
      hints: [],
      codeSnippets: {
        javascript: staticProblem.starterCode?.javascript,
        python3: staticProblem.starterCode?.python,
        java: staticProblem.starterCode?.java,
      },
      metaData: null,
    };
  }

  throw new Error(`Problem not found: ${slug}`);
}

