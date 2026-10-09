import { create } from 'zustand'
import type { AssistanceRequest, BusGps, BusStatus, Incident, IncidentStatus, FleetUnit } from '../types/transit'
import { createInitialBuses, initialFleet, initialIncidents, initialRequests, routes, stops } from '../data/transitData'

interface TransitState {
  buses: BusGps[]; requests: AssistanceRequest[]; incidents: Incident[]; fleet: FleetUnit[]
  dark: boolean; scenario: 'idle' | 'running' | 'paused' | 'complete'; scenarioStep: number
  toggleTheme: () => void; tick: () => void; alertRequest: (id: string) => void
  updateIncident: (id: string, patch: Partial<Incident>) => void; startScenario: () => void; pauseScenario: () => void; resetScenario: () => void
}
const distance = (a: [number,number], b: [number,number]) => Math.hypot((a[0]-b[0])*111, (a[1]-b[1])*108)
export const useTransitStore = create<TransitState>((set) => ({
  buses: createInitialBuses(), requests: initialRequests, incidents: initialIncidents, fleet: initialFleet, dark: true, scenario: 'idle', scenarioStep: 0,
  toggleTheme: () => set(s => ({ dark: !s.dark })),
  tick: () => set(s => {
    const now = Date.now()
    const buses = s.buses.map(bus => {
      if (bus.status === 'GPS lost') return { ...bus, lastPingAt: bus.lastPingAt }
      const route = routes.find(r => r.id === bus.routeId)!; const current = [bus.lat, bus.lng] as [number, number]
      const target = stops.find(stop => stop.id === bus.nextStopId); const targetPos = target ? [target.lat, target.lng] as [number,number] : route.waypoints[0]
      const bearing = Math.atan2(targetPos[1]-current[1], targetPos[0]-current[0]) * 180 / Math.PI
      const step = Math.max(.00015, bus.speedKmh / 3600 * 5 / 110)
      const next: [number,number] = [current[0] + (targetPos[0]-current[0]) * Math.min(1, step / Math.max(.0001, distance(current, targetPos))), current[1] + (targetPos[1]-current[1]) * Math.min(1, step / Math.max(.0001, distance(current, targetPos)))]
      const arrived = distance(next, targetPos) < .025
      const nextStopIndex = route.stopIds.indexOf(bus.nextStopId)
      const status: BusStatus = arrived ? 'Dwelling' : bus.delayMinutes ? 'Delayed' : 'Moving'
      return { ...bus, lat: next[0], lng: next[1], headingDeg: bearing, trail: [...bus.trail.slice(-29), next], nextStopId: arrived ? route.stopIds[(nextStopIndex + 1) % route.stopIds.length] : bus.nextStopId, etaSeconds: arrived ? 90 : Math.max(30, bus.etaSeconds - 5), status, lastPingAt: now }
    })
    const fleet = s.fleet.map(unit => { const lastSeen = unit.id.includes('VEL') ? unit.lastSeen + 5 : Math.max(2, unit.lastSeen + (Math.random() > .7 ? 1 : -1)); return { ...unit, lastSeen, status: lastSeen > 60 ? 'Offline' : unit.battery < 30 ? 'Low battery' : 'Healthy' } })
    const gpsLost = buses.filter(b => b.status === 'GPS lost').length
    const incidents = gpsLost && !s.incidents.some(i => i.type === 'GPS signal lost' && i.status !== 'Resolved') ? [...s.incidents, { id: `INC-GPS-${Date.now().toString().slice(-4)}`, type: 'GPS signal lost', location: buses.find(b => b.status === 'GPS lost')?.busId ?? 'Fleet', created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sla: '00:30:00', assignee: 'Unassigned', status: 'Open' as IncidentStatus }] : s.incidents
    return { ...s, buses, fleet, incidents, requests: s.requests.map(r => r.status === 'Boarded' ? r : { ...r, seconds: r.seconds + 5 }) }
  }),
  alertRequest: id => set(s => ({ requests: s.requests.map(r => r.id === id ? { ...r, alerted: true, status: 'Bus Approaching' } : r) })),
  updateIncident: (id, patch) => set(s => ({ incidents: s.incidents.map(i => i.id === id ? { ...i, ...patch } : i) })),
  startScenario: () => set({ scenario: 'running', scenarioStep: 0 }),
  pauseScenario: () => set(s => ({ scenario: s.scenario === 'running' ? 'paused' : 'running' })),
  resetScenario: () => set({ scenario: 'idle', scenarioStep: 0, buses: createInitialBuses(), requests: initialRequests, incidents: initialIncidents }),
}))
export { stops, routes }
