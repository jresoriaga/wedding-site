// Loading skeleton for venue cards
export default function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border-2 border-gray-100 bg-white p-4 animate-pulse"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
      </div>
    </div>
  )
}
