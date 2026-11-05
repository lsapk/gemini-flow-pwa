export interface FocusSessionState {
  id: string;
  userId: string;
  title: string;
  totalSeconds: number;
  remainingSeconds: number;
  deadline: number | null;
  startedAt: number;
}
export function remainingFocusSeconds(
  session: FocusSessionState,
  now = Date.now(),
): number {
  return Math.min(
    session.totalSeconds,
    Math.max(
      0,
      session.deadline === null
        ? session.remainingSeconds
        : Math.ceil((session.deadline - now) / 1000),
    ),
  );
}
export function pauseFocus(
  session: FocusSessionState,
  now = Date.now(),
): FocusSessionState {
  return {
    ...session,
    remainingSeconds: remainingFocusSeconds(session, now),
    deadline: null,
  };
}
export function resumeFocus(
  session: FocusSessionState,
  now = Date.now(),
): FocusSessionState {
  return { ...session, deadline: now + session.remainingSeconds * 1000 };
}
export function readFocusSession(
  raw: string | null,
  userId: string,
): FocusSessionState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as FocusSessionState;
    if (
      !value ||
      value.userId !== userId ||
      typeof value.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(value.id) ||
      typeof value.title !== "string" ||
      value.title.length > 200 ||
      !Number.isInteger(value.totalSeconds) ||
      value.totalSeconds < 60 ||
      value.totalSeconds > 7200 ||
      !Number.isFinite(value.remainingSeconds) ||
      value.remainingSeconds < 0 ||
      value.remainingSeconds > value.totalSeconds ||
      (value.deadline !== null && !Number.isFinite(value.deadline)) ||
      !Number.isFinite(value.startedAt)
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
