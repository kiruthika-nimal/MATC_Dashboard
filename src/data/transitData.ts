import type { RouteDef, Stop, BusGps, AssistanceRequest, Incident, FleetUnit } from '../types/transit'

export const stops: Stop[] = [
  ['mgbs', 'MGBS Imlibun', 17.3850, 78.4867, 5, 88, 'Healthy'],
  ['secunderabad', 'Secunderabad Rly Stn', 17.4399, 78.4983, 4, 82, 'Healthy'],
  ['ameerpet', 'Ameerpet', 17.4374, 78.4487, 4, 76, 'Healthy'],
  ['lb-nagar', 'LB Nagar', 17.3471, 78.5528, 4, 54, 'Low battery'],
  ['jubilee-hills', 'Jubilee Hills Check Post', 17.4324, 78.4073, 3, 91, 'Healthy'],
  ['kondapur', 'Kondapur', 17.4646, 78.3612, 3, 79, 'Healthy'],
  ['gachibowli', 'Gachibowli', 17.4401, 78.3489, 4, 85, 'Healthy'],
  ['uppal', 'Uppal', 17.4055, 78.5598, 3, 62, 'Healthy'],
  ['mehdipatnam', 'Mehdipatnam', 17.3931, 78.4365, 4, 73, 'Healthy'],
  ['kukatpally', 'Kukatpally', 17.4848, 78.3996, 4, 58, 'Low battery'],
  ['dilsukhnagar', 'Dilsukhnagar', 17.3686, 78.5274, 3, 48, 'Healthy'],
  ['hitech-city', 'HITECH City', 17.4474, 78.3762, 5, 94, 'Healthy'],
].map(([id, name, lat, lng, bays, score, beaconStatus]) => ({
  id: id as string, name: name as string, lat: lat as number, lng: lng as number,
  bays: bays as number, accessibilityScore: score as number, beaconStatus: beaconStatus as Stop['beaconStatus']
}))

export const routes: RouteDef[] = [
  { id: '5K',   name: '5K',   color: '#5fe4ef', stopIds: ['mgbs','ameerpet','jubilee-hills','kondapur','hitech-city'], waypoints: [[17.3850,78.4867],[17.4374,78.4487],[17.4324,78.4073],[17.4646,78.3612],[17.4474,78.3762]] },
  { id: '218M', name: '218M', color: '#aa91ff', stopIds: ['secunderabad','ameerpet','mehdipatnam','mgbs'], waypoints: [[17.4399,78.4983],[17.4374,78.4487],[17.3931,78.4365],[17.3850,78.4867]] },
  { id: '10H',  name: '10H',  color: '#57d7a0', stopIds: ['hitech-city','gachibowli','kondapur'], waypoints: [[17.4474,78.3762],[17.4401,78.3489],[17.4646,78.3612]] },
  { id: '86F',  name: '86F',  color: '#f5bd65', stopIds: ['uppal','lb-nagar','dilsukhnagar','mgbs'], waypoints: [[17.4055,78.5598],[17.3471,78.5528],[17.3686,78.5274],[17.3850,78.4867]] },
  { id: '47P',  name: '47P',  color: '#fa7784', stopIds: ['kukatpally','ameerpet','mehdipatnam','secunderabad'], waypoints: [[17.4848,78.3996],[17.4374,78.4487],[17.3931,78.4365],[17.4399,78.4983]] },
  { id: '65C',  name: '65C',  color: '#ff9b70', stopIds: ['dilsukhnagar','uppal','secunderabad','mgbs'], waypoints: [[17.3686,78.5274],[17.4055,78.5598],[17.4399,78.4983],[17.3850,78.4867]] },
]

export const initialRequests: AssistanceRequest[] = [
  { id: '#PWD-104', stopId: 'ameerpet',     bay: 2, routeId: '5K',   seconds: 74,  status: 'Waiting',         alerted: false },
  { id: '#PWD-087', stopId: 'gachibowli',   bay: 1, routeId: '10H',  seconds: 182, status: 'Bus Approaching', alerted: true  },
  { id: '#PWD-112', stopId: 'jubilee-hills', bay: 3, routeId: '86F',  seconds: 246, status: 'Boarded',         alerted: true  },
]

export const initialIncidents: Incident[] = [
  { id: 'INC-2084', type: 'Beacon offline',       location: 'LB Nagar · Bay 2',       stopId: 'lb-nagar',    created: '10:42', sla: '01:14:22', assignee: 'Unassigned', status: 'Open' },
  { id: 'INC-2083', type: 'Possible skipped stop', location: '218M · Ameerpet',         stopId: 'ameerpet',   created: '10:36', sla: '00:47:08', assignee: 'Priya S.',   status: 'Open', evidence: 'GPS trail: 17.4371,78.4489 → 17.4380,78.4501 · speed 29 km/h · dwell 0s' },
  { id: 'INC-2082', type: 'Low battery',           location: 'Kukatpally · Stop beacon', stopId: 'kukatpally', created: '09:58', sla: '00:19:44', assignee: 'Arun K.',    status: 'Assigned' },
  { id: 'INC-2081', type: 'Missed announcement',   location: '5K · MGBS Imlibun',       stopId: 'mgbs',       created: '09:21', sla: 'Resolved',  assignee: 'Karthik R.', status: 'Resolved' },
]

export const initialFleet: FleetUnit[] = [
  { id: 'STP-KKP-02', type: 'Stop beacon', location: 'Kukatpally · Bay 1', battery: 23, lastSeen: 12, status: 'Low battery' },
  { id: 'STP-LBN-02', type: 'Stop beacon', location: 'LB Nagar · Bay 2',   battery: 64, lastSeen: 72, status: 'Offline'     },
  { id: 'STP-AMR-01', type: 'Stop beacon', location: 'Ameerpet · Bay 1',   battery: 89, lastSeen: 5,  status: 'Healthy'     },
  { id: 'STP-MGS-01', type: 'Stop beacon', location: 'MGBS · Bay 2',       battery: 96, lastSeen: 4,  status: 'Healthy'     },
]

const interpolate = (a: [number, number], b: [number, number], p: number): [number, number] =>
  [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]

export function createInitialBuses(): BusGps[] {
  return Array.from({ length: 30 }, (_, i) => {
    const route = routes[i % routes.length]
    const n = i % (route.waypoints.length - 1)
    const p = ((i * 17) % 100) / 100
    const pos = interpolate(route.waypoints[n], route.waypoints[n + 1], p)
    return {
      busId: `BUS-${route.id}-${String(i + 1).padStart(2, '0')}`,
      plate: `TS 09 ${String(1000 + i).slice(-4)} AB`,
      routeId: route.id,
      lat: pos[0], lng: pos[1],
      speedKmh: 18 + (i % 5) * 4,
      headingDeg: 45 + i * 11,
      status: i === 7 ? 'GPS lost' : i % 9 === 0 ? 'Dwelling' : 'Moving',
      nextStopId: route.stopIds[(n + 1) % route.stopIds.length],
      etaSeconds: 80 + i * 11,
      delayMinutes: i % 8 === 0 ? 3 : 0,
      lastPingAt: Date.now(),
      trail: [pos],
    }
  })
}
