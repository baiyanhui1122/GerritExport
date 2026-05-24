import type { ExportCommitItem } from './types'

export function formatGitLogText(item: ExportCommitItem): string {
  const lines: string[] = []

  lines.push(`commit ${item.commitSha}`)
  lines.push(`Author: ${item.authorName} <${item.authorEmail}>`)
  lines.push(`Date:   ${item.authorDate}`)
  lines.push('')

  const messageLines = item.commitMessage.replace(/\r\n/g, '\n').split('\n')
  for (const line of messageLines) {
    lines.push(`    ${line}`)
  }

  return lines.join('\n')
}

export function normalizeCommitMessage(message: string, changeId: string): string {
  const normalized = (message || '').replace(/\r\n/g, '\n').trimEnd()
  if (!changeId || /(^|\n)\s*Change-Id:\s*I[0-9a-f]+/i.test(normalized)) {
    return normalized
  }
  return `${normalized}\n\nChange-Id: ${changeId}`
}
