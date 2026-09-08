import { useState } from "react";
import { Code2Icon, LoaderIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useProblems } from "../hooks/useProblems";
import { getDifficultyBadgeClass } from "../lib/utils";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
}) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const { data, isLoading } = useProblems({
    limit: 100,
    difficulty: difficulty || undefined,
  });

  const problems = (data?.problems || []).filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">Create New Session</h3>

        <div className="space-y-6">
          {/* FILTERS */}
          <div className="flex gap-2">
            <label className="input input-bordered flex items-center gap-2 flex-1">
              <SearchIcon className="size-4 opacity-50" />
              <input
                type="text"
                placeholder="Search LeetCode problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="grow"
              />
            </label>
            <select
              className="select select-bordered"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* PROBLEM LIST */}
          <div className="space-y-1">
            <label className="label">
              <span className="label-text font-semibold">Select Problem</span>
              <span className="label-text-alt text-error">*</span>
            </label>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoaderIcon className="animate-spin size-6 text-primary" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-base-300 rounded-xl divide-y divide-base-200">
                {problems.slice(0, 80).map((problem) => (
                  <button
                    key={problem.id}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-base-200 transition-colors ${
                      roomConfig.problem === problem.title ? "bg-primary/10" : ""
                    }`}
                    onClick={() =>
                      setRoomConfig({
                        difficulty: problem.difficulty,
                        problem: problem.title,
                        titleSlug: problem.titleSlug,
                      })
                    }
                  >
                    <div>
                      <p className="font-medium text-sm">{problem.title}</p>
                      <p className="text-xs text-base-content/50">{problem.category}</p>
                    </div>
                    <span className={`badge badge-sm shrink-0 ${getDifficultyBadgeClass(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </button>
                ))}
                {problems.length === 0 && (
                  <p className="text-center text-base-content/50 py-6 text-sm">No problems found</p>
                )}
              </div>
            )}
          </div>

          {/* ROOM SUMMARY */}
          {roomConfig.problem && (
            <div className="alert alert-success">
              <Code2Icon className="size-5" />
              <div>
                <p className="font-semibold">Room Summary:</p>
                <p>Problem: <span className="font-medium">{roomConfig.problem}</span></p>
                <p>Difficulty: <span className="font-medium">{roomConfig.difficulty}</span></p>
                <p>Max Participants: <span className="font-medium">2 (1-on-1 session)</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary gap-2"
            onClick={onCreateRoom}
            disabled={isCreating || !roomConfig.problem}
          >
            {isCreating ? <LoaderIcon className="size-5 animate-spin" /> : <PlusIcon className="size-5" />}
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export default CreateSessionModal;
