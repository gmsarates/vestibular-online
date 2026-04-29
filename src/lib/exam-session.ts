let runtimeExamSessionId: string | null = null;
const armedAttempts = new Set<string>();
const consumedAttempts = new Set<string>();

function randomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

// Runtime-only id: survives SPA navigation, but NOT reload/new tab.
export function getOrCreateExamSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  if (!runtimeExamSessionId) runtimeExamSessionId = randomId();
  return runtimeExamSessionId;
}

// Allow opening /exam exactly once for a given attempt in this runtime.
export function armAttemptAccess(attemptId: string): void {
  armedAttempts.add(attemptId);
  consumedAttempts.delete(attemptId);
}

export function consumeAttemptAccess(attemptId: string): boolean {
  if (!armedAttempts.has(attemptId)) return false;
  if (consumedAttempts.has(attemptId)) return false;
  consumedAttempts.add(attemptId);
  return true;
}
