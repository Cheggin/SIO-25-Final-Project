// NASA EONET API Types
export interface EONETEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  closed?: string;
  categories: Array<{
    id: string;
    title: string;
  }>;
  sources?: Array<{
    id: string;
    url: string;
  }>;
  geometry: Array<{
    magnitudeValue?: number;
    magnitudeUnit?: string;
    date: string;
    type: 'Point' | 'Polygon';
    coordinates: number[] | number[][];
  }>;
}

export interface EONETResponse {
  title: string;
  description: string;
  link: string;
  events: EONETEvent[];
}

// USGS Earthquake API Types
export interface USGSEarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number;
  gap: number | null;
  magType: string;
  type: string;
  title: string;
}

export interface USGSEarthquakeFeature {
  type: 'Feature';
  properties: USGSEarthquakeProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

export interface USGSEarthquakeResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquakeFeature[];
  bbox?: number[];
}