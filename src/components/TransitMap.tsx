import { useEffect, useMemo, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Marker as LeafletMarker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { BusFront, LocateFixed, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { routes, stops, useTransitStore } from '../store/useTransitStore'
import type { BusGps } from '../types/transit'
import 'leaflet/dist/leaflet.css'

const center: [number, number] = [17.41, 78.445]
function TileErrors({ onError }: { onError: () => void }) { useMapEvents({ tileerror: onError }); return null }
function Follow({ bus }: { bus?: BusGps }) { const map = useMap(); useEffect(() => { if (bus) map.setView([bus.lat, bus.lng], Math.max(map.getZoom(), 14), { animate: true }) }, [bus, map]); return null }
function markerIcon(bus: BusGps, color: string) {
  const status = bus.status === 'GPS lost' ? '#9aa7b2' : bus.status === 'Moving' ? '#57d7a0' : '#f5bd65'
  const busIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="transform:rotate(${-bus.headingDeg}deg);display:block;flex-shrink:0"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78C19.61 17.67 20 16.88 20 16V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM16 11H8V7h8v4z"/></svg>`
  return L.divIcon({ className: 'bus-marker-wrap', html: `<div class="bus-marker" style="--route:${color};--status:${status};transform:rotate(${bus.headingDeg}deg)">${busIcon}<b style="transform:rotate(${-bus.headingDeg}deg)">${bus.routeId}</b></div>`, iconSize: [48, 48], iconAnchor: [24, 24] })
}

export default function TransitMap({ compact = false }: { compact?: boolean }) {
  const buses = useTransitStore(s => s.buses); const requests = useTransitStore(s => s.requests)
  const [params] = useSearchParams(); const navigate = useNavigate(); const [selectedId, setSelectedId] = useState(params.get('bus')); const [layers, setLayers] = useState({ buses: true, routes: true, stops: true, assistance: true }); const [tileErrors, setTileErrors] = useState(0); const [routeFilter, setRouteFilter] = useState('All'); const [statusFilter, setStatusFilter] = useState('All')
  const selected = buses.find(b => b.busId === selectedId)
  const visibleBuses = useMemo(() => buses.filter(b => (routeFilter === 'All' || b.routeId === routeFilter) && (statusFilter === 'All' || b.status === statusFilter)), [buses, routeFilter, statusFilter])
  const routeMap = new Map(routes.map(r => [r.id, r]))
  return <div className={`map-shell ${compact ? 'compact-map' : ''}`}>
    <div className="map-toolbar"><div className="filter-chips">{['All', ...routes.map(r => r.id)].map(r => <button key={r} className={routeFilter === r ? 'active' : ''} onClick={() => setRouteFilter(r)}>{r}</button>)}</div>{!compact && <select aria-label="Filter buses by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Moving</option><option>Dwelling</option><option>Delayed</option><option>GPS lost</option></select>}</div>
    {tileErrors > 2 && <div className="map-offline"><LocateFixed size={15} /> Map tiles unavailable (offline). GPS positions still shown.</div>}
    <MapContainer center={center} zoom={compact ? 12 : 13} scrollWheelZoom={!compact} className="leaflet-map" aria-label="Live GPS map of Hyderabad transit fleet"><TileErrors onError={() => setTileErrors(v => v + 1)} /><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="(c) OpenStreetMap contributors" /><Follow bus={selected} />
      {layers.routes && routes.filter(r => routeFilter === 'All' || r.id === routeFilter).map(r => <Polyline key={r.id} positions={r.waypoints} pathOptions={{ color: r.color, weight: compact ? 2 : 4, opacity: .7 }} />)}
      {layers.stops && stops.map(stop => <span key={stop.id}><Circle center={[stop.lat, stop.lng]} radius={40} pathOptions={{ color: stop.accessibilityScore >= 80 ? '#57d7a0' : stop.accessibilityScore >= 50 ? '#f5bd65' : '#fa7784', fillOpacity: .08 }} /><CircleMarker center={[stop.lat, stop.lng]} radius={7} pathOptions={{ color: stop.accessibilityScore >= 80 ? '#57d7a0' : stop.accessibilityScore >= 50 ? '#f5bd65' : '#fa7784', fillColor: '#07121d', fillOpacity: 1 }} eventHandlers={{ click: () => navigate(`/live-map?stop=${stop.id}`) }}><Tooltip direction="top">{stop.name} · score {stop.accessibilityScore} · beacon {stop.beaconStatus}</Tooltip></CircleMarker></span>)}
      {layers.assistance && requests.filter(r => r.status !== 'Boarded').map(req => { const stop = stops.find(s => s.id === req.stopId)!; return <CircleMarker key={req.id} center={[stop.lat, stop.lng]} radius={11} pathOptions={{ color: '#aa91ff', fillColor: '#aa91ff', fillOpacity: .8, className: 'assistance-pulse' }}><Tooltip>{req.id} · {stop.name} · GPS ETA coarse</Tooltip></CircleMarker> })}
      {layers.buses && visibleBuses.map(bus => <Marker key={bus.busId} bus={bus} routeMap={routeMap} onSelect={setSelectedId} />)}
      {selected && <Polyline positions={selected.trail} pathOptions={{ color: '#fff', dashArray: '5 7', weight: 3 }} />}
    </MapContainer>
    {!compact && <div className="map-bottom"><div className="layer-toggle">{Object.entries(layers).map(([key, value]) => <label key={key}><input type="checkbox" checked={value} onChange={e => setLayers(v => ({ ...v, [key]: e.target.checked }))} /> {key[0].toUpperCase() + key.slice(1)}</label>)}</div><div className="map-legend"><span><i className="legend-moving" /> Moving</span><span><i className="legend-dwelling" /> Dwelling / Delayed</span><span><i className="legend-lost" /> GPS lost</span></div></div>}
    {selected && <aside className="bus-detail"><button className="close-detail" onClick={() => setSelectedId(null)} aria-label="Clear selection"><X size={16} /></button><div className="detail-route"><BusFront size={18} /><strong>{selected.routeId}</strong><span>{selected.status}</span></div><h3>{selected.busId}</h3><p className="muted">{selected.plate}</p><dl><dt>Speed</dt><dd>{selected.speedKmh} km/h</dd><dt>Next stop</dt><dd>{stops.find(s => s.id === selected.nextStopId)?.name}</dd><dt>ETA</dt><dd>{Math.floor(selected.etaSeconds / 60)}m {selected.etaSeconds % 60}s (coarse)</dd><dt>Delay</dt><dd>{selected.delayMinutes ? `${selected.delayMinutes} min` : 'On time'}</dd><dt>Last ping</dt><dd>{Math.max(0, Math.round((Date.now() - selected.lastPingAt) / 1000))}s ago</dd></dl><p className="ble-link">GPS ETA coarse → BLE proximity zone <b>Mid → Near</b> (last meters)</p><button className="primary-btn" onClick={() => setSelectedId(selected.busId)}>Follow bus</button></aside>}
  </div>
}
function Marker({ bus, routeMap, onSelect }: { bus: BusGps; routeMap: Map<string, typeof routes[number]>; onSelect: (id: string) => void }) {
  return <LeafletMarker position={[bus.lat, bus.lng]} icon={markerIcon(bus, routeMap.get(bus.routeId)?.color ?? '#5fe4ef')} eventHandlers={{ click: () => onSelect(bus.busId) }}><Tooltip direction="top">{bus.busId} · {bus.routeId} · {bus.status}</Tooltip></LeafletMarker>
}
