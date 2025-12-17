// src/observability/metrics.ts


type Metric = {
  count: number
  total: number
}

const metrics = new Map<string, Metric>()

export function recordMetric(name: string, value: number): void {
  const metric = metrics.get(name)

  if (!metric) {
    metrics.set(name, { count: 1, total: value })
  } else {
    metric.count += 1
    metric.total += value
  }
}

export function getMetricSummary(name: string): {
  count: number
  avg?: number
} {
  const metric = metrics.get(name)

  if (!metric) {
    return { count: 0 }
  }

  const { count, total } = metric

  if (count === 0) {
    return { count }
  }

  return {
    count,
    avg: total / count
  }
}