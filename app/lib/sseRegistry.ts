// SSE fan-out writer registry
// NOTE: Works on single-instance Node.js runtime (local dev + single Vercel function instance).
// On Vercel serverless with multiple instances, use Supabase Realtime as fan-out bus instead.
// See: docs/specs/ITINPLAN0306-plan.md Spike 1 risk note.

type Writer = {
  write: (data: string) => void
  close: () => void
}

const writers = new Set<Writer>()

export function registerWriter(writer: Writer): () => void {
  writers.add(writer)
  return () => {
    writers.delete(writer)
   }
}

export function broadcast(eventName: string, data: unknown): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  writers.forEach((w) => {
    try {
      w.write(payload)
    } catch {
      writers.delete(w)
    }
  })
}

export function getWriterCount(): number {
  return writers.size
}
