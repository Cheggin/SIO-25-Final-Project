export interface DisasterLocation {
  id: string;
  name: string;
  type: 'wildfire' | 'flood' | 'hurricane' | 'drought' | 'heatwave' | 'storm' | 'earthquake' | 'volcano' | 'other';
  latitude: number;
  longitude: number;
  date: Date;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  affectedPeople: number;
  summary: string;
  donationLinks: DonationLink[];
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  magnitude?: number;
  originalId?: string;
}

export interface DonationLink {
  organization: string;
  url: string;
  description: string;
}

export interface GlobeMarker {
  position: [number, number, number];
  disaster: DisasterLocation;
}