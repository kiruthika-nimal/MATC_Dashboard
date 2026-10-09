import type { RouteDef, Stop, BusGps, AssistanceRequest, Incident, FleetUnit } from '../types/transit'

export const stops: Stop[] = [
  ['guindy', 'Guindy', 13.0067, 80.2206, 4, 82, 'Healthy'], ['kathipara', 'Kathipara Junction', 13.0108, 80.2121, 3, 74, 'Healthy'],
  ['saidapet', 'Saidapet', 13.0213, 80.2231, 3, 78, 'Healthy'], ['little-mount', 'Little Mount', 13.0145, 80.2253, 2, 88, 'Healthy'],
  ['adyar', 'Adyar', 13.0012, 80.2565, 4, 91, 'Healthy'], ['velachery', 'Velachery', 12.9815, 80.2180, 4, 52, 'Low battery'],
  ['tnagar', 'T. Nagar', 13.0418, 80.2341, 4, 64, 'Healthy'], ['egmore', 'Egmore', 13.0732, 80.2609, 3, 69, 'Healthy'],
  ['anna-nagar', 'Anna Nagar', 13.0850, 80.2101, 4, 87, 'Healthy'], ['mylapore', 'Mylapore', 13.0368, 80.2676, 3, 73, 'Healthy'],
  ['thiruvanmiyur', 'Thiruvanmiyur', 12.9830, 80.2594, 3, 56, 'Low battery'], ['central', 'Chennai Central', 13.0827, 80.2707, 5, 94, 'Healthy'],
].map(([id, name, lat, lng, bays, score, beaconStatus]) => ({ id: id as string, name: name as string, lat: lat as number, lng: lng as number, bays: bays as number, accessibilityScore: score as number, beaconStatus: beaconStatus as Stop['beaconStatus'] }))

export const routes: RouteDef[] = [
  { id: '23C', name: '23C', color: '#5fe4ef', stopIds: ['central', 'egmore', 'saidapet', 'guindy', 'velachery'], waypoints: [[13.0827,80.2707],[13.0732,80.2609],[13.0418,80.2341],[13.0213,80.2231],[13.0067,80.2206],[12.9815,80.218]] },
  { id: '47A', name: '47A', color: '#aa91ff', stopIds: ['central','egmore','tnagar','guindy'], waypoints: [[13.0827,80.2707],[13.0732,80.2609],[13.0418,80.2341],[13.0067,80.2206]] },
  { id: '18A', name: '18A', color: '#57d7a0', stopIds: ['anna-nagar','egmore','central'], waypoints: [[13.085,80.2101],[13.0732,80.2609],[13.0827,80.2707]] },
  { id: '21G', name: '21G', color: '#f5bd65', stopIds: ['mylapore','adyar','little-mount','guindy'], waypoints: [[13.0368,80.2676],[13.0012,80.2565],[13.0145,80.2253],[13.0067,80.2206]] },
  { id: '5E', name: '5E', color: '#fa7784', stopIds: ['thiruvanmiyur','adyar','saidapet','egmore'], waypoints: [[12.983,80.2594],[13.0012,80.2565],[13.0213,80.2231],[13.0732,80.2609]] },
  { id: '70', name: '70', color: '#ff9b70', stopIds: ['velachery','guindy','tnagar','central'], waypoints: [[12.9815,80.218],[13.0067,80.2206],[13.0418,80.2341],[13.0827,80.2707]] },
]

export const initialRequests: AssistanceRequest[] = [
  { id: '#PWD-104', stopId: 'guindy', bay: 2, routeId: '23C', seconds: 74, status: 'Waiting', alerted: false },
  { id: '#PWD-087', stopId: 'adyar', bay: 1, routeId: '18A', seconds: 182, status: 'Bus Approaching', alerted: true },
  { id: '#PWD-112', stopId: 'tnagar', bay: 3, routeId: '21G', seconds: 246, status: 'Boarded', alerted: true },
]
export const initialIncidents: Incident[] = [
  { id: 'INC-2084', type: 'Beacon offline', location: 'Velachery · Bay 2', stopId: 'velachery', created: '10:42', sla: '01:14:22', assignee: 'Unassigned', status: 'Open' },
  { id: 'INC-2083', type: 'Possible skipped stop', location: '47A · T. Nagar', stopId: 'tnagar', created: '10:36', sla: '00:47:08', assignee: 'Priya S.', status: 'Open', evidence: 'GPS trail: 13:0409,80:2338 → 13:0430,80:2350 · speed 27 km/h · dwell 0s' },
  { id: 'INC-2082', type: 'Low battery', location: 'Mylapore · Stop beacon', stopId: 'mylapore', created: '09:58', sla: '00:19:44', assignee: 'Arun K.', status: 'Assigned' },
  { id: 'INC-2081', type: 'Missed announcement', location: '23C · Egmore', stopId: 'egmore', created: '09:21', sla: 'Resolved', assignee: 'Karthik R.', status: 'Resolved' },
]
export const initialFleet: FleetUnit[] = [
  { id: 'STP-MYL-02', type: 'Stop beacon', location: 'Mylapore · Bay 1', battery: 23, lastSeen: 12, status: 'Low battery' },
  { id: 'STP-VEL-02', type: 'Stop beacon', location: 'Velachery · Bay 2', battery: 64, lastSeen: 72, status: 'Offline' },
  { id: 'STP-GUI-01', type: 'Stop beacon', location: 'Guindy · Bay 1', battery: 89, lastSeen: 5, status: 'Healthy' },
  { id: 'STP-CEN-01', type: 'Stop beacon', location: 'Central · Bay 2', battery: 96, lastSeen: 4, status: 'Healthy' },
]
const interpolate = (a: [number, number], b: [number, number], p: number): [number, number] => [a[0] + (b[0]-a[0])*p, a[1] + (b[1]-a[1])*p]
export function createInitialBuses(): BusGps[] {
  return Array.from({ length: 30 }, (_, i) => {
    const route = routes[i % routes.length]; const n = i % (route.waypoints.length - 1); const p = ((i * 17) % 100) / 100
    const pos = interpolate(route.waypoints[n], route.waypoints[n + 1], p)
    return { busId: `BUS-${route.id}-${String(i + 1).padStart(2, '0')}`, plate: `TN 09 ${String(1000 + i).slice(-4)} AB`, routeId: route.id, lat: pos[0], lng: pos[1], speedKmh: 18 + (i % 5) * 4, headingDeg: 45 + i * 11, status: i === 7 ? 'GPS lost' : i % 9 === 0 ? 'Dwelling' : 'Moving', nextStopId: route.stopIds[(n + 1) % route.stopIds.length], etaSeconds: 80 + i * 11, delayMinutes: i % 8 === 0 ? 3 : 0, lastPingAt: Date.now(), trail: [pos] }
  })
}
