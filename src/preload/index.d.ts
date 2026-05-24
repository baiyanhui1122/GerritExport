import type { UrovoApi } from './index'

declare global {
  interface Window {
    urovo: UrovoApi
  }
}
