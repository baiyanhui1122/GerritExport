import axios, { type AxiosInstance } from 'axios'
import { parseGerritJson } from '../utils/xssi'
import { retry, mapWithConcurrency } from '../utils/retry'
import { buildReviewUrl, trimSlash } from '../utils/url'
import { buildGerritQuery, passCreatedDateFilter } from '../../shared/query'
import { formatGitLogText, normalizeCommitMessage } from '../../shared/formatGitLog'
import type {
  ChangedFileItem,
  ExportCommitItem,
  GerritChange,
  GerritCommit,
  GerritFile,
  GerritInlineComment,
  GerritInstance,
  GerritMessage,
  FileDiffRow,
  InlineCommentItem,
  QueryOptions,
  QueryResult,
  ReviewMessageItem
} from '../../shared/types'

interface GerritDiffChunk {
  ab?: string[]
  a?: string[]
  b?: string[]
  skip?: number
}

interface GerritFileDiff {
  content?: GerritDiffChunk[]
}

export class GerritClient {
  private readonly http: AxiosInstance

  constructor(
    private readonly instance: GerritInstance,
    private readonly signal?: AbortSignal
  ) {
    this.http = axios.create({
      baseURL: trimSlash(instance.baseUrl),
      timeout: 30_000,
      responseType: 'text',
      paramsSerializer: {
        indexes: null
      },
      transformResponse: [(data) => data],
      auth: instance.username
        ? {
            username: instance.username,
            password: instance.token
          }
        : undefined
    })
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    await this.requestText('/config/server/version')
    return { ok: true, message: '连接成功' }
  }

  async queryChanges(options: QueryOptions): Promise<QueryResult> {
    const pageSize = options.pageSize || 100
    const maxResults = options.maxResults || 1000
    const query = buildGerritQuery(options)
    const changes: GerritChange[] = []
    let start = 0
    let more = true

    while (more && changes.length < maxResults) {
      const batch = await this.fetchChangePage(query, pageSize, start)
      changes.push(...batch)
      more = Boolean(batch.at(-1)?._more_changes)
      start += batch.length
      if (!batch.length) break
    }

    const filtered = changes
      .slice(0, maxResults)
      .filter((change) => passCreatedDateFilter(change.created, options))

    const errors: QueryResult['errors'] = []
    const items = await mapWithConcurrency(filtered, options.concurrency || 5, async (change) => {
      try {
        return await this.toExportItem(change, options)
      } catch (error) {
        const message = this.humanError(error)
        errors.push({ changeNumber: change._number, message })
        return this.fallbackItem(change, message)
      }
    })

    return { items, errors }
  }

  private async fetchChangePage(query: string, pageSize: number, start: number): Promise<GerritChange[]> {
    const response = await this.requestText('/changes/', {
      q: query,
      o: ['CURRENT_REVISION', 'CURRENT_COMMIT', 'DETAILED_LABELS', 'DETAILED_ACCOUNTS'],
      n: pageSize,
      S: start
    })
    return parseGerritJson<GerritChange[]>(response)
  }

  private async toExportItem(change: GerritChange, options: QueryOptions): Promise<ExportCommitItem> {
    const number = change._number || change.number || 0
    const currentRevision = change.current_revision || change.currentRevision || ''
    const revision = currentRevision ? change.revisions?.[currentRevision] : undefined
    const commit = revision?.commit || (await this.getCommit(number))
    const changeId = change.change_id || change.changeId || this.extractChangeId(commit.message)
    const commitMessage = normalizeCommitMessage(commit.message, changeId)
    const base: ExportCommitItem = {
      project: change.project,
      branch: change.branch,
      changeNumber: number,
      changeId,
      status: change.status,
      subject: change.subject,
      commitSha: commit.commit || currentRevision,
      authorName: commit.author?.name || '',
      authorEmail: commit.author?.email || '',
      authorDate: commit.author?.date || '',
      committerName: commit.committer?.name || '',
      committerEmail: commit.committer?.email || '',
      committerDate: commit.committer?.date || '',
      ownerName: change.owner?.name || change.owner?.username,
      ownerEmail: change.owner?.email,
      created: change.created,
      updated: change.updated,
      submitted: change.submitted,
      insertions: change.insertions,
      deletions: change.deletions,
      reviewUrl: buildReviewUrl(this.instance, change.project, number),
      commitMessage,
      gitLogText: ''
    }
    base.gitLogText = formatGitLogText(base)

    if (options.includeReviewMessages) base.reviewMessages = await this.getMessages(number)
    if (options.includeInlineComments) base.inlineComments = await this.getComments(number)
    base.changedFiles = await this.getFiles(number, options)
    return base
  }

  private async getCommit(changeNumber: number): Promise<GerritCommit> {
    const response = await this.requestText(`/changes/${encodeURIComponent(String(changeNumber))}/revisions/current/commit`)
    return parseGerritJson<GerritCommit>(response)
  }

  private async getMessages(changeNumber: number): Promise<ReviewMessageItem[]> {
    const response = await this.requestText(`/changes/${encodeURIComponent(String(changeNumber))}/messages`)
    return parseGerritJson<GerritMessage[]>(response).map((item) => ({
      changeNumber,
      author: item.author?.name || item.author?.username || '',
      date: item.date || '',
      patchSet: item._revision_number,
      message: item.message
    }))
  }

  private async getComments(changeNumber: number): Promise<InlineCommentItem[]> {
    const response = await this.requestText(`/changes/${encodeURIComponent(String(changeNumber))}/comments`)
    const files = parseGerritJson<Record<string, GerritInlineComment[]>>(response)
    return Object.entries(files).flatMap(([filePath, comments]) =>
      comments.map((comment) => ({
        changeNumber,
        patchSet: comment.patch_set,
        filePath,
        line: comment.line,
        author: comment.author?.name || comment.author?.username || '',
        updated: comment.updated,
        message: comment.message,
        resolved: !comment.unresolved,
        inReplyTo: comment.in_reply_to
      }))
    )
  }

  private async getFiles(changeNumber: number, options: QueryOptions): Promise<ChangedFileItem[]> {
    const response = await this.requestText(`/changes/${encodeURIComponent(String(changeNumber))}/revisions/current/files`)
    const files = parseGerritJson<Record<string, GerritFile>>(response)
    const items: ChangedFileItem[] = Object.entries(files).map(([filePath, file]) => ({
      changeNumber,
      filePath,
      status: file.status,
      linesInserted: file.lines_inserted,
      linesDeleted: file.lines_deleted,
      sizeDelta: file.size_delta,
      size: file.size
    }))

    if (!options.includeDiffs && !options.includeFileContents) return items

    return mapWithConcurrency(items, Math.min(options.concurrency || 5, 5), async (item) => {
      if (options.includeDiffs) {
        try {
          const diff = await this.getFileDiff(changeNumber, item.filePath)
          item.diff = diff.text
          item.diffRows = diff.rows
        } catch (error) {
          item.diffError = this.humanError(error)
        }
      }

      if (options.includeFileContents) {
        try {
          item.content = await this.getFileContent(changeNumber, item.filePath)
        } catch (error) {
          item.contentError = this.humanError(error)
        }
      }

      return item
    })
  }

  private async getFileDiff(changeNumber: number, filePath: string): Promise<{ text: string; rows: FileDiffRow[] }> {
    const response = await this.requestText(`/changes/${encodeURIComponent(String(changeNumber))}/revisions/current/files/${encodeURIComponent(filePath)}/diff`, {
      context: 10
    })
    const diff = parseGerritJson<GerritFileDiff>(response)
    return this.diffToText(diff)
  }

  private async getFileContent(changeNumber: number, filePath: string): Promise<string> {
    const response = await this.requestText(`/changes/${encodeURIComponent(String(changeNumber))}/revisions/current/files/${encodeURIComponent(filePath)}/content`)
    const base64 = response.replace(/^\)\]\}'\s*/, '').trim()
    return Buffer.from(base64, 'base64').toString('utf8')
  }

  private diffToText(diff: GerritFileDiff): { text: string; rows: FileDiffRow[] } {
    const lines: string[] = []
    const rows: FileDiffRow[] = []
    let oldLine = 1
    let newLine = 1

    for (const chunk of diff.content || []) {
      if (chunk.skip) {
        const text = `... ${chunk.skip} unmodified lines ...`
        lines.push(text)
        rows.push({ type: 'skip', text })
        oldLine += chunk.skip
        newLine += chunk.skip
      }

      for (const line of chunk.ab || []) {
        lines.push(` ${line}`)
        rows.push({ type: 'context', oldLine: oldLine++, newLine: newLine++, text: line })
      }

      for (const line of chunk.a || []) {
        lines.push(`-${line}`)
        rows.push({ type: 'removed', oldLine: oldLine++, text: line })
      }

      for (const line of chunk.b || []) {
        lines.push(`+${line}`)
        rows.push({ type: 'added', newLine: newLine++, text: line })
      }
    }

    return { text: lines.join('\n'), rows }
  }

  private async requestText(url: string, params?: Record<string, unknown>): Promise<string> {
    try {
      const response = await retry(() => this.http.get<string>(url, { params, signal: this.signal }), 2)
      return response.data
    } catch (error) {
      throw new Error(this.humanError(error))
    }
  }

  private extractChangeId(message: string): string {
    return message.match(/Change-Id:\s*(I[0-9a-f]+)/i)?.[1] || ''
  }

  private fallbackItem(change: GerritChange, message: string): ExportCommitItem {
    const number = change._number || change.number || 0
    const item: ExportCommitItem = {
      project: change.project,
      branch: change.branch,
      changeNumber: number,
      changeId: change.change_id || change.changeId || '',
      status: change.status,
      subject: change.subject,
      commitSha: change.current_revision || '',
      authorName: '',
      authorEmail: '',
      authorDate: '',
      committerName: '',
      committerEmail: '',
      committerDate: '',
      ownerName: change.owner?.name || change.owner?.username,
      ownerEmail: change.owner?.email,
      created: change.created,
      updated: change.updated,
      submitted: change.submitted,
      insertions: change.insertions,
      deletions: change.deletions,
      reviewUrl: buildReviewUrl(this.instance, change.project, number),
      commitMessage: change.subject,
      gitLogText: '',
      error: message
    }
    item.gitLogText = formatGitLogText(item)
    return item
  }

  private humanError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') return '请求超时，请检查 Gerrit 网络或缩小查询范围'
      if (!error.response) return 'Gerrit 地址不可达或网络中断'
      if (error.response.status === 401) return '账号或 Token 无效'
      if (error.response.status === 403) return '无权限访问该 Gerrit 资源'
      if (error.response.status === 404) return 'Gerrit 资源不存在'
      return `Gerrit 返回错误：${error.response.status}`
    }
    return error instanceof Error ? error.message : '未知错误'
  }
}
