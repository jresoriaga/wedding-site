// SSE fan-out writer registry for activity votes — separate from sseRegistry (restaurants)
// [AC-ACTIVITIES-F5] Mirror of app/lib/sseRegistry.ts

type Writer = {
  write: (data: string) => void
  close: () => void
}

const writers = new Set<Writer>()

export function registerActivityWriter(writer: Writer): () => void {
  writers.add(writer)
  return () => {
    writers.delete(writer)
  }
}

export function broadcastActivity(eventName: string, data: unknown): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  writers.forEach((w) => {
    try {
      w.write(payload)
    } catch {
      writers.delete(w)
    }
  })
}

export function getActivityWriterCount(): number {
  return writers.size
}
