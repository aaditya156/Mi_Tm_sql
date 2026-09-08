import { useQuery } from "@tanstack/react-query";
import { fetchProblems, fetchProblemBySlug } from "../api/problems";

export function useProblems({ limit = 50, skip = 0, difficulty, tags } = {}) {
  return useQuery({
    queryKey: ["problems", { limit, skip, difficulty, tags }],
    queryFn: () => fetchProblems({ limit, skip, difficulty, tags }),
    staleTime: 1000 * 60 * 10, // cache for 10 minutes
  });
}

export function useProblemBySlug(slug) {
  return useQuery({
    queryKey: ["problem", slug],
    queryFn: () => fetchProblemBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });
}
