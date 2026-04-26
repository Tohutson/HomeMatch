export const DEFAULT_POST_LOGIN_PATH = "/";

export function getSafeNextPath(
  nextPath: string | null,
  fallback = DEFAULT_POST_LOGIN_PATH,
) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}
