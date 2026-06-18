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
//  Pin colours by type
// ─────────────────────────────────────────────────────────────────────────────
const PIN_STYLE: Record<AdminMapPin['type'], { dot: string; badge: string; ring: string }> = {
  event:   { dot: '#FF6B35', badge: 'bg-adventure-orange text-white', ring: 'rgba(255,107,53,0.25)' },
  gallery: { dot: '#1B4332', badge: 'bg-[#1B4332] text-white',        ring: 'rgba(27,67,50,0.25)' },
  place:   { dot: '#d97706', badge: 'bg-amber-600 text-white',        ring: 'rgba(217,119,6,0.25)' },
}

// ─────────────────────────────────────────────────────────────────────────────
//  Division Data
// ─────────────────────────────────────────────────────────────────────────────
const DISTRICT_TO_DIVISION: Record<string, string> = {
  // Dhaka
  Dhaka: 'Dhaka', Faridpur: 'Dhaka', Gazipur: 'Dhaka', Gopalganj: 'Dhaka', Kishoreganj: 'Dhaka', Madaripur: 'Dhaka', Manikganj: 'Dhaka', Munshiganj: 'Dhaka', Narayanganj: 'Dhaka', Narsingdi: 'Dhaka', Rajbari: 'Dhaka', Shariatpur: 'Dhaka', Tangail: 'Dhaka',
  // Mymensingh
  Jamalpur: 'Mymensingh', Mymensingh: 'Mymensingh', Netrakona: 'Mymensingh', Sherpur: 'Mymensingh',
  // Rajshahi
  Bogra: 'Rajshahi', Joypurhat: 'Rajshahi', Naogaon: 'Rajshahi', Natore: 'Rajshahi', Nawabganj: 'Rajshahi', Pabna: 'Rajshahi', Rajshahi: 'Rajshahi', Sirajganj: 'Rajshahi',
  // Rangpur
  Dinajpur: 'Rangpur', Gaibandha: 'Rangpur', Kurigram: 'Rangpur', Lalmonirhat: 'Rangpur', Nilphamari: 'Rangpur', Panchagarh: 'Rangpur', Rangpur: 'Rangpur', Thakurgaon: 'Rangpur',
  // Barishal
  Barguna: 'Barishal', Barisal: 'Barishal', Bhola: 'Barishal', Jhalokati: 'Barishal', Patuakhali: 'Barishal', Pirojpur: 'Barishal',
  // Chattogram
  Bandarban: 'Chattogram', Brahamanbaria: 'Chattogram', Chandpur: 'Chattogram', Chittagong: 'Chattogram', Comilla: 'Chattogram', "Cox's Bazar": 'Chattogram', Feni: 'Chattogram', Khagrachhari: 'Chattogram', Lakshmipur: 'Chattogram', Noakhali: 'Chattogram', Rangamati: 'Chattogram',
  // Sylhet
  Habiganj: 'Sylhet', Maulvibazar: 'Sylhet', Sunamganj: 'Sylhet', Sylhet: 'Sylhet',
  // Khulna
  Bagerhat: 'Khulna', Chuadanga: 'Khulna', Jessore: 'Khulna', Jhenaidah: 'Khulna', Khulna: 'Khulna', Kushtia: 'Khulna', Magura: 'Khulna', Meherpur: 'Khulna', Narail: 'Khulna', Satkhira: 'Khulna'
}

const DIVISION_COLORS: Record<string, string> = {
  Dhaka: '#dbeafe',       // blue-100
  Mymensingh: '#fce7f3',  // pink-100
  Rajshahi: '#fef08a',    // yellow-200
  Rangpur: '#ffedd5',     // orange-100
  Barishal: '#fecaca',    // red-200 (Distinct from Dhaka)
  Chattogram: '#dcfce7',  // green-100
  Sylhet: '#cffafe',      // cyan-100 (Distinct from Mymensingh)
  Khulna: '#ecfccb',      // lime-100
}

const DIVISION_LABELS = [
  { name: 'Dhaka', lat: 24.05, lng: 90.15 }, 
  { name: 'Mymensingh', lat: 24.95, lng: 90.30 },
  { name: 'Rajshahi', lat: 24.60, lng: 88.95 },
  { name: 'Rangpur', lat: 25.80, lng: 89.10 },
  { name: 'Barishal', lat: 22.50, lng: 90.25 },
  { name: 'Chattogram', lat: 22.90, lng: 91.60 },
  { name: 'Sylhet', lat: 24.70, lng: 91.60 },
  { name: 'Khulna', lat: 22.80, lng: 89.25 }
]

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────
export function BangladeshMap() {
  const [outline, setOutline]     = useState<any>(null)
  const [districts, setDistricts] = useState<any>(null)   // polygon features
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
        <defs>
          {/* Clip path representing exactly the country shape */}
          <clipPath id="bd-outline-clip">
            {outline?.features?.map((f: any, i: number) => (
              <path key={`clip-${i}`} d={featureToPath(f.geometry)} />
            ))}
          </clipPath>
        </defs>

        {/* ── Layer 1: Country Base Fill ─────────────────────────────────── */}
        {outline?.features?.map((f: any, i: number) => (
          <path
            key={`outline-${i}`}
            d={featureToPath(f.geometry)}
            fill="#ffffff"
            stroke="none"
          />
        ))}

        {/* Clipped content (doesn't spill over borders) */}
        <g clipPath="url(#bd-outline-clip)">
          {/* ── Layer 2: District polygons colored by division ───────────────── */}
          {districts?.features?.map((f: any, i: number) => {
            const districtName = f.properties.name;
            const divisionName = DISTRICT_TO_DIVISION[districtName] || 'Dhaka';
            const divisionColor = DIVISION_COLORS[divisionName];
            return (
              <path
                key={`dist-${i}`}
                d={featureToPath(f.geometry)}
                fill={divisionColor}
                stroke="#1B4332"
                strokeWidth={0.55}
                strokeLinejoin="round"
                opacity={0.8}
              />
            )
          })}
        </g>

        {/* ── Layer 3: Division Labels ───────────────────────────────────── */}
        {DIVISION_LABELS.map((label) => {
          const [x, y] = project(label.lat, label.lng)
          return (
            <text
              key={label.name}
              x={x}
              y={y}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="text-[12px] font-bold fill-[#1B4332] opacity-50 uppercase tracking-widest pointer-events-none"
              style={{ textShadow: '0px 0px 4px rgba(255,255,255,0.8)' }}
            >
              {label.name}
            </text>
          )
        })}

        {/* ── Layer 4: Country border on top of everything ───────────────── */}
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
