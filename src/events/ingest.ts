// src/events/ingest.ts


import { retry } from "../reliability/retry.js"
import { CircuitBreaker } from "../reliability/circuitBreaker.js"
import { recordMetric } from "../observability/metrics.js"

export type IngestEvent = {
  id: string
  type: string
  payload: unknown
  timestamp: number
}

// Simulación de almacenamiento (luego Postgres)
const seenEvents = new Set<string>()

const dbCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 5_000
})

async function writeToDatabase(event: IngestEvent): Promise<void> {
  // Simulación de fallo intermitente
  if (Math.random() < 0.2) {
    throw new Error("Database write failed")
  }

  seenEvents.add(event.id)
}

export async function ingestEvent(event: IngestEvent): Promise<void> {
  // Idempotency guard
  if (seenEvents.has(event.id)) {
    recordMetric("events.duplicate", 1)
    return
  }

  const start = Date.now()

  try {
    await retry(
      () =>
        dbCircuitBreaker.exec(() =>
          writeToDatabase(event)
        ),
      {
        retries: 3,
        retryOn: (err: unknown) => {
          recordMetric("events.retry", 1)
          return true
        }
      }
    )

    recordMetric("events.ingested", 1)
  } catch (err) {
    recordMetric("events.failed", 1)
    throw err
  } finally {
    recordMetric("events.latency_ms", Date.now() - start)
  }
}