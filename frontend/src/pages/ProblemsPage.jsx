import { useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useProblems } from "../hooks/useProblems";
import { ChevronRightIcon, Code2Icon, Loader2Icon, SearchIcon } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils";

const DIFFICULTY_OPTIONS = ["", "Easy", "Medium", "Hard"];
const PAGE_SIZE = 50;

function ProblemsPage() {
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);

  const { data, isLoading, isError } = useProblems({ limit: PAGE_SIZE, skip, difficulty: difficulty || undefined });

  const problems = (data?.problems || []).filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const easyCount   = problems.filter((p) => p.difficulty === "Easy").length;
  const mediumCount = problems.filter((p) => p.difficulty === "Medium").length;
  const hardCount   = problems.filter((p) => p.difficulty === "Hard").length;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Practice Problems</h1>
          <p className="text-base-content/70">
            {data?.total ? `${data.total.toLocaleString()} LeetCode problems — powered by LeetCode` : "Fetching problems from LeetCode..."}
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-6">
          <label className="input input-bordered flex items-center gap-2 flex-1 min-w-[200px]">
            <SearchIcon className="size-4 opacity-50" />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="grow"
            />
          </label>

          <select
            className="select select-bordered"
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setSkip(0); }}
          >
            <option value="">All Difficulties</option>
            {DIFFICULTY_OPTIONS.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* PROBLEMS LIST */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2Icon className="size-10 animate-spin text-primary" />
          </div>
        ) : isError && problems.length === 0 ? (
          <div className="alert alert-error">Failed to load problems. Please try refreshing.</div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-2xl border border-base-300">
            <Code2Icon className="size-12 text-base-content/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No problems found</h3>
            <p className="text-sm text-base-content/60">
              Try adjusting your search or difficulty filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                to={`/problem/${problem.titleSlug}`}
                className="card bg-base-100 hover:scale-[1.01] transition-transform"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Code2Icon className="size-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold">{problem.title}</h2>
                            <span className={`badge badge-sm ${getDifficultyBadgeClass(problem.difficulty)}`}>
                              {problem.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-base-content/60">{problem.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="font-medium text-sm">Solve</span>
                      <ChevronRightIcon className="size-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* PAGINATION */}
            <div className="flex justify-center gap-2 pt-4">
              <button
                className="btn btn-outline btn-sm"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              >
                ← Previous
              </button>
              <span className="btn btn-ghost btn-sm no-animation">
                {Math.floor(skip / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE))}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={skip + PAGE_SIZE >= (data?.total || 0)}
                onClick={() => setSkip(skip + PAGE_SIZE)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STATS */}
        {!isLoading && (
          <div className="mt-12 card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="stats stats-vertical lg:stats-horizontal">
                <div className="stat">
                  <div className="stat-title">Total (this page)</div>
                  <div className="stat-value text-primary">{problems.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Easy</div>
                  <div className="stat-value text-success">{easyCount}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Medium</div>
                  <div className="stat-value text-warning">{mediumCount}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Hard</div>
                  <div className="stat-value text-error">{hardCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemsPage;
