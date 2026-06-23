/**
 * Client helpers for the httpOnly auth cookie. The cookie itself is set/cleared
 * server-side (it is httpOnly and cannot be written by JS), so these just call
 * the corresponding API routes.
 */

/** Persist the given Firebase ID token as the httpOnly `firebaseToken` cookie. */
export async function setAuthCookie(token: string): Promise<void> {
  try {
    await fetch("/api/setAuthCookie", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Failed to set auth cookie:", error);
  }
}

/** Clear the httpOnly `firebaseToken` cookie server-side. */
export async function clearAuthCookie(): Promise<void> {
  try {
    await fetch("/api/clearCookie", { method: "POST" });
  } catch (error) {
    console.error("Failed to clear auth cookie:", error);
  }
}
