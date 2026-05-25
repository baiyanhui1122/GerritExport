import { writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dialog } from 'electron'
import ExcelJS from 'exceljs'
import dayjs from 'dayjs'
import { formatGitLogText } from '../../shared/formatGitLog'
import type { ExportCommitItem, ExportFormat, ExportHistory, ExportRequest } from '../../shared/types'
import { ConfigService } from './ConfigService'

export class ExportService {
  constructor(private readonly config: ConfigService) {}

  async export(request: ExportRequest): Promise<{ canceled: boolean; filePath?: string; history?: ExportHistory }> {
    const filePath = await this.pickPath(request.format)
    if (!filePath) return { canceled: true }

    try {
      if (request.format === 'xlsx') await this.exportXlsx(filePath, request)
      else await writeFile(filePath, request.format === 'md' ? this.toMarkdown(request) : this.toTxt(request.items), 'utf8')

      const history = this.config.addHistory({
        id: randomUUID(),
        exportedAt: new Date().toISOString(),
        gerrit: request.instance?.baseUrl || '',
        query: request.query,
        count: request.items.length,
        format: request.format,
        filePath,
        status: 'success'
      })[0]
      return { canceled: false, filePath, history }
    } catch (error) {
      this.config.addHistory({
        id: randomUUID(),
        exportedAt: new Date().toISOString(),
        gerrit: request.instance?.baseUrl || '',
        query: request.query,
        count: request.items.length,
        format: request.format,
        filePath,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private async pickPath(format: ExportFormat): Promise<string | undefined> {
    const result = await dialog.showSaveDialog({
      title: '选择导出保存位置',
      defaultPath: `gerrit-export-${dayjs().format('YYYYMMDD-HHmmss')}.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }]
    })
    return result.canceled ? undefined : result.filePath
  }

  private toTxt(items: ExportCommitItem[]): string {
    return items.map(formatGitLogText).join('\n\n')
  }

  private toMarkdown(request: ExportRequest): string {
    const lines: string[] = ['# Gerrit 修改导出报告', '']
    if (request.includeQuery) {
      lines.push('## 查询条件', '', '| 字段 | 值 |', '|---|---|')
      lines.push(`| Gerrit | ${request.instance?.baseUrl || ''} |`)
      lines.push(`| Project | ${request.query.project || ''} |`)
      lines.push(`| Branch | ${request.query.branch || ''} |`)
      lines.push(`| Status | ${request.query.status || ''} |`)
      lines.push(`| Start Date | ${request.query.startDate || ''} |`)
      lines.push(`| End Date | ${request.query.endDate || ''} |`, '')
    }
    lines.push('## 提交列表', '')
    request.items.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.subject}`, '')
      lines.push(`- Project: ${item.project}`)
      lines.push(`- Branch: ${item.branch}`)
      lines.push(`- Change Number: ${item.changeNumber}`)
      lines.push(`- Change-Id: ${item.changeId}`)
      lines.push(`- Commit: ${item.commitSha}`)
      lines.push(`- Author: ${item.authorName} <${item.authorEmail}>`)
      lines.push(`- Date: ${item.authorDate}`)
      lines.push('', '```text', formatGitLogText(item), '```', '')
    })
    return lines.join('\n')
  }

  private async exportXlsx(filePath: string, request: ExportRequest): Promise<void> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Urovo Export'
    workbook.created = new Date()

    const list = workbook.addWorksheet('提交列表')
    list.columns = [
      { header: 'Project', key: 'project' },
      { header: 'Change-Id', key: 'changeId' },
      { header: 'Subject', key: 'subject' },
      { header: 'Author', key: 'author' },
      { header: 'Review URL', key: 'reviewUrl' },
      { header: '完整提交信息', key: 'gitLogText' }
    ]
    request.items.forEach((item) =>
      list.addRow({
        project: item.project,
        changeId: item.changeId,
        subject: item.subject,
        author: `${item.authorName} <${item.authorEmail}>`,
        reviewUrl: item.reviewUrl,
        gitLogText: formatGitLogText(item)
      })
    )

    const messages = workbook.addWorksheet('Commit Message')
    messages.columns = [
      { header: '序号', key: 'index' },
      { header: 'Change Number', key: 'changeNumber' },
      { header: 'Commit SHA', key: 'commitSha' },
      { header: 'Commit Message', key: 'commitMessage' },
      { header: 'Git Log Format Text', key: 'gitLogText' }
    ]
    request.items.forEach((item, index) => messages.addRow({ index: index + 1, ...item, gitLogText: formatGitLogText(item) }))

    const review = workbook.addWorksheet('Review Messages')
    review.columns = ['Change Number', 'Author', 'Date', 'Patch Set', 'Message'].map((header) => ({ header, key: header }))
    request.items.flatMap((item) => item.reviewMessages || []).forEach((item) => review.addRow([item.changeNumber, item.author, item.date, item.patchSet, item.message]))

    const comments = workbook.addWorksheet('Inline Comments')
    comments.columns = ['Change Number', 'Patch Set', 'File Path', 'Line', 'Author', 'Updated', 'Message', 'Resolved', 'In Reply To'].map((header) => ({ header, key: header }))
    request.items.flatMap((item) => item.inlineComments || []).forEach((item) => comments.addRow([item.changeNumber, item.patchSet, item.filePath, item.line, item.author, item.updated, item.message, item.resolved, item.inReplyTo]))

    const files = workbook.addWorksheet('Changed Files')
    files.columns = ['Change Number', 'File Path', 'Status', 'Lines Inserted', 'Lines Deleted', 'Size Delta', 'Size'].map((header) => ({ header, key: header }))
    request.items.flatMap((item) => item.changedFiles || []).forEach((item) => files.addRow([item.changeNumber, item.filePath, item.status, item.linesInserted, item.linesDeleted, item.sizeDelta, item.size]))

    for (const sheet of workbook.worksheets) this.polish(sheet)
    await workbook.xlsx.writeFile(filePath)
  }

  private polish(sheet: ExcelJS.Worksheet): void {
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, sheet.rowCount), column: Math.max(1, sheet.columnCount) }
    }
    sheet.getRow(1).font = { bold: true }
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true }
      })
    })
    sheet.columns.forEach((column) => {
      let width = String(column.header || '').length + 2
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        width = Math.max(width, String(cell.value || '').slice(0, 80).length + 2)
      })
      column.width = Math.min(Math.max(width, 12), 60)
    })
  }
}
