export interface GerritAccount {
  _account_id?: number
  name?: string
  email?: string
  username?: string
  display_name?: string
}

export interface GerritGitPerson {
  name: string
  email: string
  date: string
  tz?: number
}

export interface GerritCommit {
  commit: string
  parents?: Array<{ commit: string; subject?: string }>
  author: GerritGitPerson
  committer: GerritGitPerson
  subject: string
  message: string
}

export interface GerritRevision {
  kind?: string
  number?: number
  ref?: string
  commit?: GerritCommit
  files?: Record<string, GerritFile>
}

export interface GerritChange {
  id: string
  project: string
  branch: string
  change_id: string
  changeId?: string
  subject: string
  status: string
  _number: number
  number?: number
  owner?: GerritAccount
  created?: string
  updated?: string
  submitted?: string
  insertions?: number
  deletions?: number
  current_revision?: string
  currentRevision?: string
  revisions?: Record<string, GerritRevision>
  labels?: Record<string, unknown>
  reviewers?: Record<string, GerritAccount[]>
  _more_changes?: boolean
}

export interface GerritMessage {
  id?: string
  author?: GerritAccount
  date?: string
  message: string
  _revision_number?: number
}

export interface GerritInlineComment {
  id?: string
  path?: string
  line?: number
  author?: GerritAccount
  updated?: string
  message: string
  unresolved?: boolean
  in_reply_to?: string
  patch_set?: number
}

export interface GerritFile {
  status?: string
  lines_inserted?: number
  lines_deleted?: number
  size_delta?: number
  size?: number
}

export interface GerritInstance {
  id: string
  name: string
  baseUrl: string
  username: string
  token: string
  defaultProject?: string
  defaultBranch?: string
  urlTemplate?: string
}

export type GerritStatus = 'open' | 'merged' | 'abandoned' | 'all'
export type DateType = 'updated' | 'merged' | 'created'
export type ExportFormat = 'txt' | 'md' | 'xlsx'
export type ExportRange = 'all' | 'selected' | 'single'

export interface QueryOptions {
  instanceId?: string
  project?: string
  branch?: string
  status: GerritStatus
  dateType: DateType
  startDate?: string
  endDate?: string
  owner?: string
  reviewer?: string
  keyword?: string
  changeNumber?: string
  changeId?: string
  includeReviewMessages: boolean
  includeInlineComments: boolean
  includeFiles: boolean
  pageSize: number
  maxResults: number
  concurrency: number
}

export interface ReviewMessageItem {
  changeNumber: number
  author: string
  date: string
  patchSet?: number
  message: string
}

export interface InlineCommentItem {
  changeNumber: number
  patchSet?: number
  filePath: string
  line?: number
  author: string
  updated?: string
  message: string
  resolved: boolean
  inReplyTo?: string
}

export interface ChangedFileItem {
  changeNumber: number
  filePath: string
  status?: string
  linesInserted?: number
  linesDeleted?: number
  sizeDelta?: number
  size?: number
}

export interface ExportCommitItem {
  project: string
  branch: string
  changeNumber: number
  changeId: string
  status: string
  subject: string
  commitSha: string
  authorName: string
  authorEmail: string
  authorDate: string
  committerName: string
  committerEmail: string
  committerDate: string
  ownerName?: string
  ownerEmail?: string
  created?: string
  updated?: string
  submitted?: string
  insertions?: number
  deletions?: number
  reviewUrl: string
  commitMessage: string
  gitLogText: string
  reviewMessages?: ReviewMessageItem[]
  inlineComments?: InlineCommentItem[]
  changedFiles?: ChangedFileItem[]
  error?: string
}

export interface QueryResult {
  items: ExportCommitItem[]
  errors: Array<{ changeNumber?: number; message: string }>
}

export interface ExportRequest {
  format: ExportFormat
  range: ExportRange
  query: QueryOptions
  instance?: GerritInstance
  items: ExportCommitItem[]
  includeQuery: boolean
  includeReviewMessages: boolean
  includeInlineComments: boolean
  includeFiles: boolean
}

export interface ExportHistory {
  id: string
  exportedAt: string
  gerrit: string
  query: QueryOptions
  count: number
  format: ExportFormat
  filePath: string
  status: 'success' | 'failed'
  message?: string
}

export interface AppSettings {
  darkMode: boolean
  defaultExportDir?: string
}
