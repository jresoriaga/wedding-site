'use client'
// [AC-ITINPLAN0306-F1, F2]
import { useRouter } from 'next/navigation'
import NameGate from './components/NameGate'
import { useAppStore } from './lib/store'

export default function Home() {
  const router = useRouter()
  const setUserName = useAppStore((s) => s.setUserName)

  function handleSuccess(name: string) {
    setUserName(name)
    router.push('/itinerary')
  }

  return <NameGate onSuccess={handleSuccess} />
}
