export async function retry<T>(task: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      if (isAbortError(error)) throw error
      lastError = error
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)))
      }
    }
  }
  throw lastError
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybe = error as { code?: string; name?: string; message?: string }
  return maybe.code === 'ERR_CANCELED' || maybe.name === 'CanceledError' || maybe.message === 'canceled'
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  const limit = Math.max(1, Math.min(concurrency, 10))

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}
