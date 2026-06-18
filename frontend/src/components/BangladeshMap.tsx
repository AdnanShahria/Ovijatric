import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
//  Admin-panel-ready pin data model
//  When admin panel is ready, replace MOCK_MAP_PINS with a fetch() from your API
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminMapPin {
  id: number
  name: string
  lat: number               // Real GPS latitude  — admin enters this
  lng: number               // Real GPS longitude — admin enters this
  type: 'event' | 'gallery' | 'place'
  title: string
  details: string
  image: string
  date: string
  linkedEventId?: number
  linkedGalleryIds?: number[]
  linkedPlaceSlug?: string
}

export const MOCK_MAP_PINS: AdminMapPin[] = [
  { id: 1, name: 'Rangpur',    lat: 25.7439, lng: 89.2752, type: 'event',   title: 'Rangpur Expedition Camp', details: 'Annual adventure camp in the northern plains.',     image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop', date: 'Aug 2026', linkedEventId: 1 },
  { id: 2, name: 'Sylhet',     lat: 24.8949, lng: 91.8687, type: 'event',   title: 'Sylhet Tea Garden Trek',  details: 'Trekking through tea estates and waterfalls.',     image: 'https://images.unsplash.com/photo-1552674605-15c2145efa38?q=80&w=400&auto=format&fit=crop', date: 'Sep 2026', linkedEventId: 2 },
  { id: 3, name: 'Mymensingh', lat: 24.7471, lng: 90.4203, type: 'event',   title: 'Mymensingh River Camp',   details: 'Camping by the Brahmaputra river tributaries.',     image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=400&auto=format&fit=crop', date: 'Oct 2026', linkedEventId: 3 },
  { id: 4, name: 'Khulna',     lat: 22.8456, lng: 89.5403, type: 'gallery', title: 'Sundarbans Safari',        details: 'Kayaking through the mangrove forests.',            image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=400&auto=format&fit=crop', date: 'Nov 2026', linkedGalleryIds: [1, 2, 3] },
  { id: 5, name: 'Barishal',   lat: 22.7010, lng: 90.3535, type: 'event',   title: 'Southern River Delta',    details: 'Navigating the waterways of Barishal.',            image: 'https://images.unsplash.com/photo-1501555088652-0f6bbf352816?q=80&w=400&auto=format&fit=crop', date: 'Dec 2026', linkedEventId: 5 },
  { id: 6, name: 'Chattogram', lat: 22.3569, lng: 91.7832, type: 'event',   title: 'Hill Tracts Expedition',  details: 'Trekking through CHT hills and bamboo forests.',   image: 'https://images.unsplash.com/photo-1511576661531-b34d7da5d0fa?q=80&w=400&auto=format&fit=crop', date: 'Jan 2027', linkedEventId: 6 },
  { id: 7, name: 'Rajshahi',   lat: 24.3636, lng: 88.6241, type: 'place',   title: 'RUET – Ovijatrik HQ',    details: 'Home base of Ovijatrik at RUET, Rajshahi.',        image: '/logo.jpg', date: 'Founded 2018', linkedPlaceSlug: 'ruet-hq' },
]

// ─────────────────────────────────────────────────────────────────────────────
//  Geographic projection  (equirectangular, good enough for this scale)
//  Bangladesh bounding box with generous padding so the shape is centered
// ─────────────────────────────────────────────────────────────────────────────
const BD = { minLat: 20.30, maxLat: 26.80, minLng: 87.80, maxLng: 93.00 }
const SVG_W = 500
const SVG_H = 650

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - BD.minLng) / (BD.maxLng - BD.minLng)) * SVG_W
  const y = ((BD.maxLat - lat) / (BD.maxLat - BD.minLat)) * SVG_H
  return [x, y]
}

function ringToPath(ring: number[][]): string {
  return ring
    .map(([lng, lat], i) => {
      const [x, y] = project(lat, lng)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + ' Z'
}

function lineToPath(coords: number[][]): string {
  return coords
    .map(([lng, lat], i) => {
      const [x, y] = project(lat, lng)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function featureToPath(geometry: any): string {
  const parts: string[] = []
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring: number[][]) => parts.push(ringToPath(ring)))
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly: number[][][]) =>
      poly.forEach((ring) => parts.push(ringToPath(ring)))
    )
  } else if (geometry.type === 'LineString') {
    parts.push(lineToPath(geometry.coordinates))
  } else if (geometry.type === 'MultiLineString') {
    geometry.coordinates.forEach((line: number[][]) => parts.push(lineToPath(line)))
  }
  return parts.join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
//  Major rivers of Bangladesh — hand-curated key waypoints (lat/lng pairs)
//  Padma, Jamuna, Meghna, Karnaphuli, Surma-Kushiyara system
//  These are simplified polylines tracing the river courses
// ─────────────────────────────────────────────────────────────────────────────
const RIVERS: Array<{ name: string; coords: [number, number][] }> = [
  // Jamuna (Brahmaputra) — enters north, flows south
  { name: 'Jamuna', coords: [[89.78,26.40],[89.80,25.90],[89.75,25.40],[89.67,25.00],[89.60,24.60],[89.60,24.20],[89.58,23.80]] },
  // Padma — enters west, flows SE to join Meghna
  { name: 'Padma',  coords: [[88.92,24.15],[89.30,24.00],[89.70,23.80],[90.10,23.55],[90.35,23.40],[90.55,23.38]] },
  // Meghna — formed by Padma+Jamuna confluence, flows south
  { name: 'Meghna', coords: [[90.58,23.36],[90.65,23.10],[90.70,22.80],[90.70,22.50],[90.60,22.25],[90.55,22.00]] },
  // Surma (Sylhet region)
  { name: 'Surma',  coords: [[92.30,24.90],[91.90,24.85],[91.50,24.80],[91.10,24.70],[90.70,24.60]] },
  // Karnaphuli — Chattogram
  { name: 'Karnaphuli', coords: [[92.10,22.65],[91.90,22.58],[91.75,22.45],[91.70,22.35]] },
  // Brahmaputra (old course, north Bangladesh)
  { name: 'Old Brahmaputra', coords: [[89.85,25.20],[90.00,24.90],[90.10,24.60],[90.30,24.30],[90.50,24.00]] },
]

// ─────────────────────────────────────────────────────────────────────────────
//  Pin colours by type
// ─────────────────────────────────────────────────────────────────────────────
const PIN_STYLE: Record<AdminMapPin['type'], { dot: string; badge: string; ring: string }> = {
  event:   { dot: '#FF6B35', badge: 'bg-adventure-orange text-white', ring: 'rgba(255,107,53,0.25)' },
  gallery: { dot: '#1B4332', badge: 'bg-[#1B4332] text-white',        ring: 'rgba(27,67,50,0.25)' },
  place:   { dot: '#d97706', badge: 'bg-amber-600 text-white',        ring: 'rgba(217,119,6,0.25)' },
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────
export function BangladeshMap() {
  const [outline, setOutline]     = useState<any>(null)
  const [districts, setDistricts] = useState<any>(null)   // polygon features
  const [rivers, setRivers]       = useState<any>(null)   // NaturalEarth rivers
  const [activePin, setActivePin] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load country outline (MultiPolygon)
  useEffect(() => {
    fetch('/bangladesh-outline.geojson').then(r => r.json()).then(setOutline).catch(console.error)
  }, [])

  // Load simplified district polygons (~1 MB, topology-preserving simplification)
  useEffect(() => {
    fetch('/bangladesh-districts-simple.geojson').then(r => r.json()).then(setDistricts).catch(console.error)
  }, [])

  // Load filtered rivers GeoJSON
  useEffect(() => {
    fetch('/bangladesh-rivers.geojson').then(r => r.json()).then(setRivers).catch(console.error)
  }, [])

  // Close popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setActivePin(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto select-none" style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" style={{ overflow: 'visible' }}>

        {/* ── Layer 1: Country fill (base) ───────────────────────────────── */}
        {outline?.features?.map((f: any, i: number) => (
          <path
            key={`outline-${i}`}
            d={featureToPath(f.geometry)}
            fill="#b7d4bb"
            stroke="none"
          />
        ))}

        {/* ── Layer 2: District polygons (fills + borders) ───────────────── */}
        {districts?.features?.map((f: any, i: number) => (
          <path
            key={`dist-${i}`}
            d={featureToPath(f.geometry)}
            fill="transparent"
            stroke="#1B4332"
            strokeWidth={0.55}
            strokeLinejoin="round"
            opacity={0.55}
          />
        ))}

        {/* ── Layer 3: Country border on top of districts ────────────────── */}
        {outline?.features?.map((f: any, i: number) => (
          <path
            key={`border-${i}`}
            d={featureToPath(f.geometry)}
            fill="none"
            stroke="#1B4332"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        ))}

        {/* ── Layer 4: Curated river polylines ──────────────────────────── */}
        {RIVERS.map((river) => {
          const d = river.coords.map(([lng, lat], i) => {
            const [x, y] = project(lat, lng)
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
          }).join(' ')
          return (
            <path
              key={river.name}
              d={d}
              fill="none"
              stroke="#4a9eca"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.75}
            />
          )
        })}

        {/* ── Layer 5: External rivers (NaturalEarth, if loaded) ─────────── */}
        {rivers?.features?.map((f: any, i: number) => (
          <path
            key={`river-${i}`}
            d={featureToPath(f.geometry)}
            fill="none"
            stroke="#4a9eca"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.65}
          />
        ))}

        {/* ── Layer 6: Pins ─────────────────────────────────────────────── */}
        {MOCK_MAP_PINS.map((pin) => {
          const [x, y] = project(pin.lat, pin.lng)
          const s = PIN_STYLE[pin.type]
          const isActive = activePin === pin.id
          return (
            <g key={pin.id} transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}
               onClick={() => setActivePin(isActive ? null : pin.id)}>
              <circle r={12} fill={s.ring} className="animate-ping" style={{ animationDuration: '2.5s' }} />
              <circle r={7} fill={isActive ? '#1B4332' : s.dot} stroke="white" strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))', transition: 'fill 0.2s' }} />
            </g>
          )
        })}
      </svg>

      {/* ── Popup cards ───────────────────────────────────────────────────── */}
      {MOCK_MAP_PINS.map((pin) => {
        if (activePin !== pin.id) return null
        const [x, y] = project(pin.lat, pin.lng)
        const xPct = (x / SVG_W) * 100
        const yPct = (y / SVG_H) * 100
        const s = PIN_STYLE[pin.type]
        return (
          <AnimatePresence key={`popup-${pin.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              className="absolute z-50 pointer-events-none"
              style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, calc(-100% - 20px))' }}
            >
              <div className="w-52 sm:w-60 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="h-28 w-full relative">
                  <img src={pin.image} alt={pin.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${s.badge}`}>{pin.type}</span>
                  <span className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">{pin.date}</span>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-[#1B4332] text-xs leading-tight mb-1 uppercase tracking-wide">{pin.title}</h4>
                  <p className="text-[10px] text-slate-500 mb-2 line-clamp-2 leading-relaxed">{pin.details}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-semibold text-slate-400">
                      <MapPin className="w-3 h-3 mr-0.5 text-adventure-orange" /> {pin.name}
                    </div>
                    <div className="flex gap-1">
                      {pin.linkedEventId && (
                        <span className="flex items-center gap-0.5 text-[9px] bg-orange-50 text-adventure-orange px-1.5 py-0.5 rounded-full font-bold">
                          <Calendar className="w-2.5 h-2.5" /> Event
                        </span>
                      )}
                      {pin.linkedGalleryIds && (
                        <span className="flex items-center gap-0.5 text-[9px] bg-green-50 text-[#1B4332] px-1.5 py-0.5 rounded-full font-bold">
                          <ImageIcon className="w-2.5 h-2.5" /> Gallery
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-slate-100" />
              </div>
            </motion.div>
          </AnimatePresence>
        )
      })}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-2 right-0 flex flex-col gap-1.5 text-[10px] font-semibold">
        {(['event', 'gallery', 'place'] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: PIN_STYLE[type].dot }} />
            <span className="text-slate-500 capitalize">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#4a9eca' }} />
          <span className="text-slate-400">River</span>
        </div>
      </div>
    </div>
  )
}
