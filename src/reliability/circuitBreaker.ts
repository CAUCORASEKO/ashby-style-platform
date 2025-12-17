// src/reliability/circuitBreaker.ts

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN"

export type CircuitBreakerOptions = {
  failureThreshold: number        // errores consecutivos
  resetTimeoutMs: number          // tiempo antes de probar HALF_OPEN
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED"
  private failureCount = 0
  private lastFailureTime = 0

  constructor(private options: CircuitBreakerOptions) {}

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now()

    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.options.resetTimeoutMs) {
        this.state = "HALF_OPEN"
      } else {
        throw new Error("Circuit breaker is OPEN")
      }
    }

    try {
      const result = await fn()

      // éxito → reset total
      this.failureCount = 0
      this.state = "CLOSED"

      return result
    } catch (err) {
      this.failureCount++
      this.lastFailureTime = now

      if (this.failureCount >= this.options.failureThreshold) {
        this.state = "OPEN"
      }

      throw err
    }
  }

  getState(): CircuitState {
    return this.state
  }
}