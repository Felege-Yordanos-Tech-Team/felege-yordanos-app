/**
 * Return type for server actions. Actions never throw for expected problems
 * (validation, permissions); they return { ok: false, error } so the client
 * can show a toast.
 *
 *   export async function deleteSong(id: string): Promise<ActionResult> {
 *     const user = await requireUser();
 *     if (!canManageSongs(user)) return fail(NOT_ALLOWED);
 *     ...
 *     return ok();
 *   }
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export const fail = (error: string): { ok: false; error: string } => ({
  ok: false,
  error,
});

export const NOT_ALLOWED = 'You do not have permission to do this.';
