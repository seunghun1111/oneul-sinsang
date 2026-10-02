export type SaveSummary = {
  checked: number;
  created: number;
  updated: number;
  updatedImages: number;
  updatedDates: number;
  duplicates: number;
};

export type CollectorSource<Candidate> = {
  name: string;
  collect: () => Promise<Candidate[]>;
};

export function requireCandidates<Candidate>(candidates: Candidate[]) {
  if (candidates.length === 0) throw new Error("수집 후보가 없습니다.");
  return candidates;
}

export async function runCollectorBatch<Candidate>(
  sources: readonly CollectorSource<Candidate>[],
  save: (candidates: Candidate[]) => Promise<SaveSummary>,
  onFailure: (source: string, error: unknown) => void,
) {
  const results: Array<({ source: string; status: "ok" } & SaveSummary) | { source: string; status: "failed" }> = [];
  // Start independent reads together, but do not wait for every source before saving.
  // Handle rejections immediately so a later source cannot create an unhandled rejection.
  const pending = sources.map(source => Promise.resolve().then(() => source.collect()).then(
    value => ({ status: "fulfilled" as const, value }),
    reason => ({ status: "rejected" as const, reason }),
  ));
  for (const [index, source] of sources.entries()) {
    const outcome = await pending[index];
    try {
      if (outcome.status === "rejected") throw outcome.reason;
      results.push({ source: source.name, status: "ok", ...await save(requireCandidates(outcome.value)) });
    } catch (error) {
      onFailure(source.name, error);
      results.push({ source: source.name, status: "failed" });
    }
  }
  const succeeded = results.filter(result => result.status === "ok").length;
  return { succeeded, failed: sources.length - succeeded, results };
}
