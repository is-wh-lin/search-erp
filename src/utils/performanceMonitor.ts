interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private enabled: boolean = import.meta.env.DEV

  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    })
  }

  end(name: string): number | null {
    if (!this.enabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`效能指標 "${name}" 不存在`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    console.log(
      `⏱️ ${name}: ${metric.duration.toFixed(2)}ms`,
      metric.metadata ? metric.metadata : ''
    )

    return metric.duration
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.enabled) return fn()

    this.start(name, metadata)
    try {
      const result = fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) return fn()

    this.start(name, metadata)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name)
  }

  clear(): void {
    this.metrics.clear()
  }

  clearMetric(name: string): void {
    this.metrics.delete(name)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  generateReport(): string {
    const metrics = this.getMetrics()
    if (metrics.length === 0) {
      return '沒有效能指標資料'
    }

    let report = '=== 效能報告 ===\n\n'

    const sortedMetrics = metrics
      .filter((m) => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))

    sortedMetrics.forEach((metric) => {
      report += `${metric.name}: ${metric.duration?.toFixed(2)}ms\n`
      if (metric.metadata) {
        report += `  元資料: ${JSON.stringify(metric.metadata)}\n`
      }
    })

    const totalDuration = sortedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    const avgDuration = totalDuration / sortedMetrics.length

    report += `\n=== 統計 ===\n`
    report += `總計: ${sortedMetrics.length} 個指標\n`
    report += `總時間: ${totalDuration.toFixed(2)}ms\n`
    report += `平均時間: ${avgDuration.toFixed(2)}ms\n`

    return report
  }

  monitorComponentRender(componentName: string): {
    onBeforeMount: () => void
    onMounted: () => void
  } {
    const mountKey = `${componentName}-mount`

    return {
      onBeforeMount: () => {
        this.start(mountKey, { component: componentName })
      },
      onMounted: () => {
        this.end(mountKey)
      },
    }
  }

  monitorApiRequest(
    url: string,
    method: string = 'GET'
  ): {
    start: () => void
    end: (status?: number) => void
  } {
    const key = `api-${method}-${url}`

    return {
      start: () => {
        this.start(key, { url, method })
      },
      end: (status?: number) => {
        const metric = this.metrics.get(key)
        if (metric && metric.metadata) {
          metric.metadata.status = status
        }
        this.end(key)
      },
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

export { PerformanceMonitor }

export function measurePerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyKey}`
    return performanceMonitor.measure(methodName, () => originalMethod.apply(this, args))
  }

  return descriptor
}

export function measureAsyncPerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyKey}`
    return performanceMonitor.measureAsync(methodName, () => originalMethod.apply(this, args))
  }

  return descriptor
}
