import type { MapProvider } from "@/types";

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteEstimateInput = {
  origin?: MapCoordinate | null;
  destination?: MapCoordinate | null;
  averageSpeedKmh?: number;
  trafficMultiplier?: number;
  label?: string;
};

export type RouteEstimate = {
  provider: MapProvider;
  distanceKm: number;
  durationMinutes: number;
  etaAt: Date;
  polyline: string;
  instructions: string[];
};

export type MapAdapter = {
  provider: MapProvider;
  name: string;
  estimateRoute(input: RouteEstimateInput): RouteEstimate;
};

function now() {
  return new Date();
}

function haversineKm(origin: MapCoordinate, destination: MapCoordinate) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radiusKm = 6371;
  const latDelta = toRad(destination.latitude - origin.latitude);
  const lonDelta = toRad(destination.longitude - origin.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRad(origin.latitude)) * Math.cos(toRad(destination.latitude)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(a));
}

function makeEstimate(provider: MapProvider, input: RouteEstimateInput, speedKmh: number) {
  const origin = input.origin ?? { latitude: -8.8383, longitude: 13.2344 };
  const destination = input.destination ?? { latitude: origin.latitude + 0.02, longitude: origin.longitude + 0.02 };
  const distanceKm = Number(haversineKm(origin, destination).toFixed(2));
  const trafficMultiplier = input.trafficMultiplier ?? 1;
  const durationMinutes = Math.max(Math.round((distanceKm / speedKmh) * 60 * trafficMultiplier), 5);
  const etaAt = new Date(now().getTime() + durationMinutes * 60_000);

  return {
    provider,
    distanceKm,
    durationMinutes,
    etaAt,
    polyline: JSON.stringify({ provider, origin, destination, label: input.label ?? null }),
    instructions: [
      "Saia do ponto de origem.",
      "Siga a rota principal até a área de entrega.",
      "Confirme a chegada no app do entregador.",
    ],
  };
}

function createAdapter(provider: MapProvider, name: string, speedKmh: number): MapAdapter {
  return {
    provider,
    name,
    estimateRoute(input) {
      return makeEstimate(provider, input, speedKmh);
    },
  };
}

const adapters: Record<MapProvider, MapAdapter> = {
  GOOGLE_MAPS: createAdapter("GOOGLE_MAPS", "Google Maps", 28),
  MAPBOX: createAdapter("MAPBOX", "Mapbox", 25),
  OPENSTREETMAP: createAdapter("OPENSTREETMAP", "OpenStreetMap", 22),
};

export function listMapProviders() {
  return Object.values(adapters);
}

export function getMapAdapter(provider: MapProvider) {
  return adapters[provider] ?? adapters.GOOGLE_MAPS;
}

export function estimateRoute(provider: MapProvider, input: RouteEstimateInput) {
  return getMapAdapter(provider).estimateRoute(input);
}

