import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
//  Admin-panel-ready pin data model
//  When admin panel is ready, replace MOCK_MAP_PINS with a fetch() from your API
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminMapPin {
  id: number | string
  name: string
  lat: number               // Real GPS latitude  — admin enters this
  lng: number               // Real GPS longitude — admin enters this
  type: 'event' | 'gallery' | 'place'
  title: string
  details: string
  image: string
  date: string
  linkedEventId?: number | string
  linkedGalleryIds?: number[] | string
  linkedPlaceSlug?: string
}



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
  const [activePin, setActivePin] = useState<number | string | null>(null)
  const [mapPins, setMapPins] = useState<AdminMapPin[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    import('../utils/apiClient').then(({ dynamicGet }) => {
      (dynamicGet as any)('map_pins').then((data: any) => {
        if (data && data.length > 0) {
          setMapPins(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            type: p.type as any,
            title: p.title,
            details: p.details || '',
            image: p.image_url || '',
            date: p.date_text || '',
            linkedEventId: p.linked_event_id,
            linkedGalleryIds: p.linked_gallery_ids ? JSON.parse(p.linked_gallery_ids) : undefined,
            linkedPlaceSlug: p.linked_place_slug
          })))
        }
      }).catch((err: any) => console.error("Failed to load map pins:", err))
    })
  }, [])

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
        {mapPins.map((pin) => {
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
      <AnimatePresence>
        {mapPins.map((pin) => {
          if (activePin !== pin.id) return null
          const [x, y] = project(pin.lat, pin.lng)
          const xPct = (x / SVG_W) * 100
          const yPct = (y / SVG_H) * 100
          const s = PIN_STYLE[pin.type]

          const isNearTop = y < 220;
          const isNearLeft = x < 130;
          const isNearRight = x > (SVG_W - 130);

          let xOffset = "-50%";
          let arrowLeft = "50%";
          if (isNearLeft) {
            xOffset = "-15%";
            arrowLeft = "15%";
          } else if (isNearRight) {
            xOffset = "-85%";
            arrowLeft = "85%";
          }

          const yOffsetInitial = isNearTop ? "10%" : "-90%";
          const yOffsetAnimate = isNearTop ? "15px" : "calc(-100% - 15px)";
          const originClass = isNearTop ? "origin-top" : "origin-bottom";

          let arrowClasses = "absolute w-3 h-3 bg-white/90 backdrop-blur-md rotate-45 border-white/40 ";
          if (isNearTop) {
            arrowClasses += "-top-1.5 border-t border-l";
          } else {
            arrowClasses += "-bottom-1.5 border-b border-r";
          }

          return (
            <motion.div
              key={`popup-${pin.id}`}
              initial={{ opacity: 0, y: yOffsetInitial, x: xOffset, scale: 0.92 }}
              animate={{ opacity: 1, y: yOffsetAnimate, x: xOffset, scale: 1 }}
              exit={{ opacity: 0, y: yOffsetInitial, x: xOffset, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              className={`absolute z-50 pointer-events-none ${originClass}`}
              style={{ left: `${xPct}%`, top: `${yPct}%`, filter: `drop-shadow(0 4px 20px ${s.ring.replace('0.25', '0.6')})` }}
            >
              <div className="w-52 sm:w-60 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40">
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
                <div 
                  className={`${arrowClasses} -translate-x-1/2`} 
                  style={{ left: arrowLeft }} 
                />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1.5 text-[10px] font-semibold">
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
