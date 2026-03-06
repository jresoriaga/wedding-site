'use client'
// [AC-ITINPLAN0306-F1, F2, F9]
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NameGate from './components/NameGate'
import { useAppStore } from './lib/store'

export default function Home() {
  const router = useRouter()
  const setUserName = useAppStore((s) => s.setUserName)

  // [AC-ITINPLAN0306-F9] Returning visitor — skip name gate
  useEffect(() => {
    const saved = localStorage.getItem('lu-outing-name')
    if (saved) {
      setUserName(saved)
      router.replace('/itinerary')
    }
  }, [router, setUserName])

  function handleSuccess(name: string) {
    localStorage.setItem('lu-outing-name', name)
    setUserName(name)
    router.push('/itinerary')
  }

  return <NameGate onSuccess={handleSuccess} />
}
