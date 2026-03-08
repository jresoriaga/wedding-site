import { NextResponse } from 'next/server'

const STATIC_MAPS_BASE = 'https://maps.googleapis.com/maps/api/staticmap'
const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json'
const IMG_SIZE = 640
const MAX_ROUTES = 8 // keep URL under Static Maps' ~8192-char limit

interface Pin { lat: number; lng: number; name: string }

interface MapImageBody {
  stay: { name: string; lat: number; lng: number } | null
  restaurants: Pin[]
  activities: Pin[]
}

// Cartoon-style overrides: vivid green land, deep blue water, thick dark roads
const CARTOON_STYLES = [
  // Land — vivid mid-green (like the reference illustration)
  'feature:landscape|element:geometry|color:0x78c850',
  'feature:landscape.natural|element:geometry|color:0x5da032',
  'feature:landscape.man_made|element:geometry|color:0x6ab840',
  // Water — Caribbean blue
  'feature:water|element:geometry|color:0x3399cc',
  'feature:water|element:geometry.stroke|color:0x1a7fb4|weight:2',
  'feature:water|element:labels|visibility:off',
  // Roads — bold charcoal creates the "thick black road" cartoon look
  'feature:road|element:geometry.fill|color:0x1e1e1e',
  'feature:road|element:geometry.stroke|color:0x000000|weight:2',
  'feature:road.highway|element:geometry.fill|color:0x141414',
  'feature:road.highway|element:geometry.stroke|color:0x000000|weight:3',
  'feature:road.arterial|element:geometry.fill|color:0x2e2e2e',
  'feature:road.arterial|element:geometry.stroke|color:0x111111|weight:1.5',
  'feature:road.local|element:geometry.fill|color:0x4a4a4a',
  'feature:road.local|element:geometry.stroke|color:0x333333|weight:1',
  // Parks / POI — bright leaf-green
  'feature:poi.park|element:geometry|color:0x4fa330',
  'feature:poi|element:geometry|color:0x88cc66',
  // Hide noisy POI clutter
  'feature:poi|element:labels|visibility:off',
  'feature:poi.business|visibility:off',
  'feature:transit|visibility:off',
  // Admin borders — dark forest green
  'feature:administrative|element:geometry.stroke|color:0x1a4d0f|weight:1.5',
  // Labels — white text with dark halo (readable on green background)
  'feature:all|element:labels.text.fill|color:0xffffff',
  'feature:all|element:labels.text.stroke|color:0x111111|weight:3',
  'feature:road|element:labels.text.fill|color:0xffffff',
  'feature:road|element:labels.text.stroke|color:0x2a2a2a|weight:3',
]

// Mercator lat → radians for the zoom-fit maths
function latToMerc(lat: number): number {
  const s = Math.sin((lat * Math.PI) / 180)
  return Math.log((1 + s) / (1 - s)) / 2
}

// Tile-math zoom that fits a bbox inside IMG_SIZE pixels
function fitZoom(minLat: number, maxLat: number, minLng: number, maxLng: number): number {
  const WORLD = 256
  const latFrac = Math.abs(latToMerc(maxLat) - latToMerc(minLat)) / Math.PI
  const lngFrac = Math.abs(maxLng - minLng) / 360
  const zLat = latFrac > 0 ? Math.floor(Math.log(IMG_SIZE / WORLD / latFrac) / Math.LN2) : 17
  const zLng = lngFrac > 0 ? Math.floor(Math.log(IMG_SIZE / WORLD / lngFrac) / Math.LN2) : 17
  return Math.min(zLat, zLng, 16) - 1 // -1 keeps edge pins from being clipped
}

// Fetch encoded driving-route polyline from Google Directions API
async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  key: string,
): Promise<string | null> {
  const url =
    `${DIRECTIONS_BASE}?origin=${from.lat},${from.lng}` +
    `&destination=${to.lat},${to.lng}&mode=driving&key=${key}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json() as {
      status: string
      routes?: Array<{ overview_polyline: { points: string } }>
    }
    return json.status === 'OK' ? (json.routes?.[0]?.overview_polyline?.points ?? null) : null
  } catch {
    return null
  }
}

// Numbered label for markers: 1-9 then A-Z (single char required by Static Maps API)
function markerLabel(i: number): string {
  return i < 9 ? String(i + 1) : String.fromCodePoint(65 + (i - 9))
}

// Per-route stroke colours — one per attraction so routes are distinguishable
const ROUTE_COLORS = ['1565C0', 'E65100', '6A1B9A', '00695C', 'B71C1C', '1B5E20', '0D47A1', '4A148C']

// POST /api/map-image — server-side proxy so the Maps key never ships to the client [OWASP:A1]
export async function POST(req: Request) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  let body: MapImageBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const center = body.stay ?? { name: 'La Union', lat: 16.6197, lng: 120.3199 }
  const allPins: Pin[] = [...body.restaurants, ...body.activities]

  // [OWASP:A3] Reject non-numeric coordinates before building the upstream URL
  if (
    typeof center.lat !== 'number' ||
    typeof center.lng !== 'number' ||
    !allPins.every((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
  ) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  // Bounding box of stay + all selected pins
  const lats = [center.lat, ...allPins.map((p) => p.lat)]
  const lngs = [center.lng, ...allPins.map((p) => p.lng)]
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  // 25% padding on each side so pins aren't flush against the image edges
  const latPad = Math.max((maxLat - minLat) * 0.25, 0.005)
  const lngPad = Math.max((maxLng - minLng) * 0.25, 0.005)
  const mapCenter = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
  const zoom =
    allPins.length === 0
      ? 14
      : Math.max(11, fitZoom(minLat - latPad, maxLat + latPad, minLng - lngPad, maxLng + lngPad))

  // Driving routes from stay → each attraction in parallel (max MAX_ROUTES)
  const routeTargets = allPins.slice(0, MAX_ROUTES)
  const polylines: Array<string | null> = body.stay
    ? await Promise.all(routeTargets.map((p) => fetchRoute(center, p, apiKey)))
    : routeTargets.map(() => null)

  // Build URL as joined parts — manual per-value encoding to control what gets encoded
  const parts: string[] = [
    `center=${mapCenter.lat},${mapCenter.lng}`,
    `zoom=${zoom}`,
    `size=${IMG_SIZE}x${IMG_SIZE}`,
    `scale=2`,
    `maptype=roadmap`,
    `key=${apiKey}`,
  ]

  for (const s of CARTOON_STYLES) {
    parts.push(`style=${encodeURIComponent(s)}`)
  }

  // Stay — red H marker
  if (body.stay) {
    parts.push(`markers=${encodeURIComponent(`color:red|size:large|label:H|${center.lat},${center.lng}`)}`)
  }

  // Restaurants — blue numbered markers
  body.restaurants.forEach((r, i) => {
    parts.push(`markers=${encodeURIComponent(`color:blue|size:large|label:${markerLabel(i)}|${r.lat},${r.lng}`)}`)
  })

  // Activities — orange numbered markers (index continues from restaurants)
  body.activities.forEach((a, i) => {
    const gi = body.restaurants.length + i
    parts.push(`markers=${encodeURIComponent(`color:orange|size:large|label:${markerLabel(gi)}|${a.lat},${a.lng}`)}`)
  })

  // Route polylines — drawn below the markers so pins remain visible
  polylines.forEach((poly, i) => {
    if (poly) {
      const color = `0x${ROUTE_COLORS[i % ROUTE_COLORS.length]}CC`
      parts.push(`path=${encodeURIComponent(`color:${color}|weight:5|geodesic:true|enc:${poly}`)}`)
    }
  })

  const mapUrl = `${STATIC_MAPS_BASE}?${parts.join('&')}`

  try {
    const imgRes = await fetch(mapUrl)
    if (!imgRes.ok) {
      const text = await imgRes.text().catch(() => '')
      console.error('[map-image] Google Static Maps error', imgRes.status, text.slice(0, 400))
      return NextResponse.json(
        {
          error:
            `Map API error ${imgRes.status} — ensure Maps Static API and Directions API` +
            ` are both enabled in Google Cloud Console`,
        },
        { status: 502 },
      )
    }

    const buffer = await imgRes.arrayBuffer()
    return new Response(buffer, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
