import { setScheduler, resetScheduler, runJudge } from "../lib/judge";

/**
 * In production the lock response is sent first and Next's `after` runs the
 * judge behind it. Tests call the route handlers directly, where there is no
 * request scope, so they stand in a scheduler that keeps the same ordering —
 * handler returns, then the run — and hand back a promise to wait on.
 */
let judging: Promise<void> = Promise.resolve();

export function inlineJudge() {
  judging = Promise.resolve();
  setScheduler((caseId) => {
    judging = runJudge(caseId);
  });
}

export const stopInlineJudge = resetScheduler;

/** Settles whatever the last lock or retry scheduled. */
export const judged = () => judging;
