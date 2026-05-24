import type { GerritInstance } from '../../shared/types'

export function trimSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function buildReviewUrl(instance: GerritInstance, project: string, changeNumber: number): string {
  const base = trimSlash(instance.baseUrl)
  const template = instance.urlTemplate || '{base}/c/{project}/+/{number}'
  return template
    .replaceAll('{base}', base)
    .replaceAll('{project}', encodeURIComponent(project).replaceAll('%2F', '/'))
    .replaceAll('{number}', String(changeNumber))
}
