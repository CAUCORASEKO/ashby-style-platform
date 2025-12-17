// src/reliability/retry.ts

export type RetryOptions = {
  retries?: number
  backoffMs?: number
  maxBackoffMs?: number
  jitter?: boolean
  retryOn?: (error: unknown) => boolean
}

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    backoffMs = 200,
    maxBackoffMs = 2_000,
    jitter = true,
    retryOn = () => true
  } = options

  let attempt = 0
  let lastError: unknown

  while (attempt <= retries) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      attempt++

      if (attempt > retries || !retryOn(err)) {
        throw err
      }

      const exponentialBackoff = Math.min(
        backoffMs * Math.pow(2, attempt - 1),
        maxBackoffMs
      )

      const delay = jitter
        ? Math.random() * exponentialBackoff
        : exponentialBackoff

      await sleep(delay)
    }
  }

  // Defensive — should never be reached
  throw lastError
}