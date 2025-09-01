export interface DisasterLocation {
  id: string;
  name: string;
  type: 'wildfire' | 'flood' | 'hurricane' | 'drought' | 'heatwave' | 'storm' | 'earthquake' | 'other';
  latitude: number;
  longitude: number;
  date: Date;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  affectedPeople: number;
  summary: string;
  donationLinks: DonationLink[];
  source?: string;
  imageUrl?: string;
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