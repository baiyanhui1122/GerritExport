export function stripXssiPrefix(payload: string): string {
  return payload.startsWith(")]}'") ? payload.replace(/^\)\]\}'\s*\n?/, '') : payload
}

export function parseGerritJson<T>(payload: string): T {
  return JSON.parse(stripXssiPrefix(payload)) as T
}
