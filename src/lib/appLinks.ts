const INTERNAL_ROUTE_ALIASES: Record<string, string> = {
  "/": "/(tabs)",
  "/home": "/(tabs)",
  "/feed": "/(tabs)",
  "/posts": "/(tabs)",
  "/search": "/(tabs)/search",
  "/messages": "/(tabs)/messages",
  "/profile": "/(tabs)/profile",
  "/create": "/(tabs)/create",
  "/tokens": "/(tabs)/tokens",
  "/more": "/(tabs)/more",
  "/login": "/auth/login",
  "/register": "/auth/register",
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function resolveAppHref(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return null;
  }

  if (!trimmedUrl.startsWith("/")) {
    return null;
  }

  const [pathname, query = ""] = trimmedUrl.split("?");
  const normalizedPath = normalizePathname(pathname);
  const resolvedPath = INTERNAL_ROUTE_ALIASES[normalizedPath] ?? normalizedPath;

  return query ? `${resolvedPath}?${query}` : resolvedPath;
}

export function isExternalHref(url: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url.trim());
}
