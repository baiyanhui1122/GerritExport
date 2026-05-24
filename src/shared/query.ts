import dayjs from 'dayjs'
import type { QueryOptions } from './types'

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`
}

function appendTime(date: string, end = false): string {
  if (!date) return ''
  const parsed = dayjs(date)
  const value = parsed.isValid() ? parsed.format('YYYY-MM-DD') : date.slice(0, 10)
  return `${value} ${end ? '23:59:59' : '00:00:00'} +0800`
}

export function buildGerritQuery(options: QueryOptions): string {
  const parts: string[] = []

  if (options.changeNumber) parts.push(options.changeNumber.startsWith('#') ? options.changeNumber : `#${options.changeNumber}`)
  if (options.changeId) parts.push(options.changeId)
  if (options.project) parts.push(`project:${options.project}`)
  if (options.branch) parts.push(`branch:${options.branch}`)
  if (options.status && options.status !== 'all') parts.push(`status:${options.status}`)
  if (options.owner) parts.push(`owner:${options.owner}`)
  if (options.reviewer) parts.push(`reviewer:${options.reviewer}`)
  if (options.keyword) parts.push(options.keyword)

  if (options.dateType === 'merged') {
    if (options.startDate) parts.push(`mergedafter:${quote(appendTime(options.startDate))}`)
    if (options.endDate) parts.push(`mergedbefore:${quote(appendTime(options.endDate, true))}`)
  } else if (options.dateType === 'updated') {
    if (options.startDate) parts.push(`after:${quote(appendTime(options.startDate))}`)
    if (options.endDate) parts.push(`before:${quote(appendTime(options.endDate, true))}`)
  } else {
    if (options.startDate) parts.push(`after:${quote(appendTime(options.startDate))}`)
    if (options.endDate) parts.push(`before:${quote(appendTime(options.endDate, true))}`)
  }

  return parts.join(' ')
}

export function passCreatedDateFilter(created: string | undefined, options: QueryOptions): boolean {
  if (options.dateType !== 'created') return true
  if (!created) return false
  const value = dayjs(created)
  if (options.startDate && value.isBefore(dayjs(options.startDate).startOf('day'))) return false
  if (options.endDate && value.isAfter(dayjs(options.endDate).endOf('day'))) return false
  return true
}
