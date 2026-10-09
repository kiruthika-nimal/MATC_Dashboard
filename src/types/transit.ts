export type BusStatus = 'Moving' | 'Dwelling' | 'Delayed' | 'GPS lost'
export type RequestStatus = 'Waiting' | 'Bus Approaching' | 'Boarded'
export type IncidentStatus = 'Open' | 'Assigned' | 'Resolved'

export interface Stop {
  id: string; name: string; lat: number; lng: number; bays: number
  accessibilityScore: number; beaconStatus: 'Healthy' | 'Low battery' | 'Offline'
}
export interface RouteDef { id: string; name: string; color: string; waypoints: [number, number][]; stopIds: string[] }
export interface BusGps {
  busId: string; plate: string; routeId: string; lat: number; lng: number
  speedKmh: number; headingDeg: number; status: BusStatus; nextStopId: string
  etaSeconds: number; delayMinutes: number; lastPingAt: number; trail: [number, number][]
}
export interface AssistanceRequest {
  id: string; stopId: string; bay: number; routeId: string; seconds: number
  status: RequestStatus; alerted: boolean
}
export interface Incident {
  id: string; type: string; location: string; stopId?: string; created: string
  sla: string; assignee: string; status: IncidentStatus; evidence?: string
}
export interface FleetUnit { id: string; type: 'Stop beacon' | 'Bus unit'; location: string; battery: number; lastSeen: number; status: string }
