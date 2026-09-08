import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useProblemBySlug } from "../hooks/useProblems";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import OutputPanel from "../components/OutputPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import { executeCode } from "../lib/piston";
import { PROBLEMS } from "../data/problems";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

// Map our language selector values → LeetCode langSlugs
const LANG_SLUG_MAP = {
  javascript: "javascript",
  python:     "python3",
  java:       "java",
};

const FALLBACK_CODE = {
  javascript: "// Write your solution here\n\n",
  python:     "# Write your solution here\n\n",
  java: `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
};

function ProblemPage() {
  const { id } = useParams(); // id = titleSlug e.g. "two-sum"

  const { data: problem, isLoading, isError } = useProblemBySlug(id);

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(FALLBACK_CODE.javascript);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Helper: resolve the best starter code for a given language
  const getStarterCode = (lang, snippets) => {
    const slug = LANG_SLUG_MAP[lang];
    return (snippets && slug && snippets[slug]) || FALLBACK_CODE[lang] || "";
  };

  // When problem loads, hydrate editor with the real function signature
  useEffect(() => {
    if (problem?.codeSnippets) {
      setCode(getStarterCode(selectedLanguage, problem.codeSnippets));
    }
  }, [problem]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setCode(getStarterCode(newLang, problem?.codeSnippets));
    setOutput(null);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.2, y: 0.6 } });
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.8, y: 0.6 } });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    // Build test cases from LeetCode GraphQL problem data, fallback to static PROBLEMS
    const dynamicExamples = problem?.examples;
    const staticProblem = PROBLEMS[id];

    let testCases;
    if (dynamicExamples && dynamicExamples.length > 0) {
      testCases = dynamicExamples.map((ex, i) => ({
        label: ex.label || `Example ${i + 1}`,
        input: ex.input || "",
        rawInput: ex.rawInput || ex.input || "",
        expected: ex.output || "",
      }));
    } else if (staticProblem?.examples) {
      testCases = staticProblem.examples.map((ex, i) => ({
        label: `Example ${i + 1}`,
        input: ex.input ?? "",
        expected: staticProblem.expectedOutput?.[selectedLanguage]
          ?.split("\n")[i] ?? ex.output,
      }));
    }

    const result = await executeCode(
      selectedLanguage,
      code,
      testCases?.length ? testCases : undefined,
      problem?.metaData
    );
    setOutput(result);
    setIsRunning(false);

    if (result.success) {
      triggerConfetti();
      toast.success(
        result.mode === "testcases"
          ? `${result.passCount}/${result.totalCount} test cases passed! 🎉`
          : "Code ran successfully!"
      );
    } else {
      toast.error(
        result.mode === "testcases"
          ? `${result.passCount}/${result.totalCount} test cases passed`
          : "Code execution failed!"
      );
    }
  };

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* LEFT — Problem Description */}
          <Panel defaultSize={40} minSize={30}>
            <div className="h-full overflow-y-auto bg-base-200 p-6 space-y-5">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2Icon className="size-10 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="alert alert-error">Failed to load problem.</div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold">{problem.title}</h1>
                      <span className={`badge badge-lg ${
                        problem.difficulty === "Easy" ? "badge-success" :
                        problem.difficulty === "Medium" ? "badge-warning" : "badge-error"
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/50">{problem.category}</p>
                  </div>

                  {/* Description HTML from LeetCode */}
                  {problem.descriptionHtml && (
                    <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                      <div
                        className="prose prose-sm max-w-none text-base-content/90 [&_pre]:bg-base-200 [&_pre]:p-3 [&_pre]:rounded-lg [&_code]:text-primary [&_img]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: problem.descriptionHtml }}
                      />
                    </div>
                  )}

                  {/* Hints */}
                  {problem.hints?.length > 0 && (
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                      <input type="checkbox" />
                      <div className="collapse-title font-semibold">Hints ({problem.hints.length})</div>
                      <div className="collapse-content space-y-2">
                        {problem.hints.map((hint, i) => (
                          <div key={i} className="text-sm text-base-content/80 p-2 bg-base-200 rounded-lg">
                            {hint}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT — Editor + Output */}
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <CodeEditorPanel
                  selectedLanguage={selectedLanguage}
                  code={code}
                  isRunning={isRunning}
                  onLanguageChange={handleLanguageChange}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                />
              </Panel>
              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />
              <Panel defaultSize={30} minSize={20}>
                <OutputPanel output={output} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default ProblemPage;
