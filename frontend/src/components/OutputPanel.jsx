import { CheckCircleIcon, XCircleIcon } from "lucide-react";

function OutputPanel({ output }) {
  const isTestMode = output?.mode === "testcases";

  return (
    <div className="h-full bg-base-100 flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 bg-base-200 border-b border-base-300 flex items-center justify-between">
        <span className="font-semibold text-sm">
          {isTestMode ? "Test Results" : "Output"}
        </span>
        {isTestMode && output && (
          <span className={`badge badge-sm font-bold ${
            output.success ? "badge-success" : "badge-error"
          }`}>
            {output.passCount}/{output.totalCount} Passed
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {output === null ? (
          <p className="text-base-content/50 text-sm">Click "Run Code" to see results here...</p>

        ) : isTestMode ? (
          // ── Per-test-case results ──────────────────────────────────────────
          <>
            {/* Summary banner */}
            <div className={`rounded-lg p-3 flex items-center gap-3 ${
              output.success
                ? "bg-success/10 border border-success/30"
                : "bg-error/10 border border-error/30"
            }`}>
              {output.success
                ? <CheckCircleIcon className="size-5 text-success shrink-0" />
                : <XCircleIcon className="size-5 text-error shrink-0" />}
              <span className={`font-semibold text-sm ${output.success ? "text-success" : "text-error"}`}>
                {output.success
                  ? "All test cases passed! 🎉"
                  : `${output.passCount} of ${output.totalCount} test cases passed`}
              </span>
            </div>

            {/* Individual test cases */}
            {output.results?.map((tc, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 space-y-2 ${
                  tc.passed
                    ? "border-success/30 bg-success/5"
                    : "border-error/30 bg-error/5"
                }`}
              >
                {/* Case header */}
                <div className="flex items-center gap-2">
                  {tc.passed
                    ? <CheckCircleIcon className="size-4 text-success" />
                    : <XCircleIcon className="size-4 text-error" />}
                  <span className="font-semibold text-sm">
                    {tc.label || `Test Case ${i + 1}`}
                  </span>
                  <span className={`badge badge-xs ml-auto ${tc.passed ? "badge-success" : "badge-error"}`}>
                    {tc.passed ? "PASS" : "FAIL"}
                  </span>
                </div>

                {/* Input */}
                {tc.input != null && tc.input !== "" && (
                  <div className="text-xs space-y-0.5">
                    <p className="text-base-content/50 font-medium">Input</p>
                    <pre className="font-mono bg-base-200 rounded px-2 py-1 whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                )}

                {/* Expected */}
                <div className="text-xs space-y-0.5">
                  <p className="text-base-content/50 font-medium">Expected</p>
                  <pre className="font-mono bg-base-200 rounded px-2 py-1 whitespace-pre-wrap text-success">{tc.expected}</pre>
                </div>

                {/* Your output */}
                <div className="text-xs space-y-0.5">
                  <p className="text-base-content/50 font-medium">Your Output</p>
                  <pre className={`font-mono bg-base-200 rounded px-2 py-1 whitespace-pre-wrap ${tc.passed ? "text-success" : "text-error"}`}>
                    {tc.error || tc.output || "(no output)"}
                  </pre>
                </div>
              </div>
            ))}
          </>

        ) : output.success ? (
          // ── Plain success ──────────────────────────────────────────────────
          <pre className="text-sm font-mono text-success whitespace-pre-wrap">{output.output}</pre>

        ) : (
          // ── Plain error ────────────────────────────────────────────────────
          <div>
            {output.output && (
              <pre className="text-sm font-mono text-base-content whitespace-pre-wrap mb-2">{output.output}</pre>
            )}
            <pre className="text-sm font-mono text-error whitespace-pre-wrap">{output.error}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
export default OutputPanel;

