import { formatGitLogText } from '@shared/formatGitLog'

export { formatGitLogText }

export function shortSha(value?: string): string {
  return value ? value.slice(0, 10) : '-'
}

export function statusType(status: string): 'success' | 'warning' | 'info' | 'danger' {
  if (status === 'MERGED' || status === 'merged') return 'success'
  if (status === 'NEW' || status === 'open') return 'warning'
  if (status === 'ABANDONED' || status === 'abandoned') return 'danger'
  return 'info'
}
