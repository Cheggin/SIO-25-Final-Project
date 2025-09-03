import type { DisasterLocation } from '../types/disaster';
import type { USGSEarthquakeResponse, USGSEarthquakeFeature } from '../types/apiTypes';

export class USGSService {
  private static readonly BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1';
  
  // Calculate severity based on magnitude
  // Note: Conservative ratings since we don't have actual casualty/impact data
  private static calculateSeverity(magnitude: number): DisasterLocation['severity'] {
    if (magnitude >= 8.0) return 'critical';  // Great earthquake (very rare)
    if (magnitude >= 7.0) return 'high';      // Major earthquake  
    if (magnitude >= 6.0) return 'high';      // Strong earthquake
    if (magnitude >= 5.5) return 'moderate';  // Moderate earthquake
    if (magnitude >= 5.0) return 'moderate';  // Light earthquake with potential damage
    return 'low';                             // Minor earthquake
  }
  
  // Don't estimate affected people - USGS doesn't provide this data
  // Return 0 to be consistent with other sources that lack impact data
  private static getAffectedPeople(): number {
    // USGS doesn't provide affected people data, so we return 0
    // to avoid confusion with estimated numbers alongside real impact data
    return 0;
  }
  
  // Generate a comprehensive summary for the earthquake
  private static generateSummary(feature: USGSEarthquakeFeature): string {
    const parts: string[] = [];
    const props = feature.properties;
    
    // Start with magnitude and location
    parts.push(`Magnitude ${props.mag} earthquake`);
    
    if (props.place) {
      parts.push(props.place);
    }
    
    // Add time
    const date = new Date(props.time);
    parts.push(`on ${date.toLocaleDateString()}`);
    
    // Add depth
    const depth = feature.geometry.coordinates[2];
    parts.push(`at ${depth.toFixed(1)} km depth`);
    
    // Add tsunami warning if applicable
    if (props.tsunami === 1) {
      parts.push('(Tsunami warning issued)');
    }
    
    // Add alert level if present
    if (props.alert) {
      const alertColors: { [key: string]: string } = {
        'green': 'Low impact expected',
        'yellow': 'Moderate impact expected',
        'orange': 'Significant impact expected',
        'red': 'Extreme impact expected'
      };
      if (alertColors[props.alert]) {
        parts.push(`Alert: ${alertColors[props.alert]}`);
      }
    }
    
    // Add felt reports if available
    if (props.felt && props.felt > 0) {
      parts.push(`Felt by ${props.felt} people`);
    }
    
    return parts.join(' ') + '.';
  }
  
  // Validate earthquake data
  private static isValidEarthquake(feature: USGSEarthquakeFeature): boolean {
    // Must have valid geometry
    if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length < 3) {
      return false;
    }
    
    const [lon, lat, depth] = feature.geometry.coordinates;
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || isNaN(depth)) return false;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
    
    // Must have properties
    if (!feature.properties) return false;
    
    // Must have magnitude
    if (!feature.properties.mag || isNaN(feature.properties.mag)) return false;
    
    // Must have valid time
    if (!feature.properties.time || isNaN(feature.properties.time)) return false;
    
    // Must have place or title
    if (!feature.properties.place && !feature.properties.title) return false;
    
    return true;
  }
  
  // Convert USGS earthquake to DisasterLocation format
  private static convertToDisasterLocation(feature: USGSEarthquakeFeature): DisasterLocation | null {
    // Validate first
    if (!this.isValidEarthquake(feature)) {
      console.warn(`Invalid USGS earthquake skipped: ${feature.id}`, feature);
      return null;
    }
    
    const [longitude, latitude] = feature.geometry.coordinates;
    const props = feature.properties;
    const date = new Date(props.time);
    
    const disaster: DisasterLocation = {
      id: `usgs-${feature.id}`,
      originalId: feature.id,
      name: props.title || props.place || `M${props.mag} Earthquake`,
      type: 'earthquake',
      latitude,
      longitude,
      date,
      severity: this.calculateSeverity(props.mag),
      affectedPeople: this.getAffectedPeople(),
      summary: this.generateSummary(feature),
      donationLinks: [],
      source: 'USGS',
      sourceUrl: props.url,
      magnitude: props.mag
    };
    
    return disaster;
  }
  
  // Build query parameters
  private static buildQueryParams(params: {
    starttime?: string;
    endtime?: string;
    minmagnitude?: number;
    limit?: number;
  }): string {
    const queryParams = new URLSearchParams({
      format: 'geojson',
      orderby: 'time-asc'
    });
    
    // Add optional parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  }
  
  // Fetch recent earthquakes
  static async fetchRecentEarthquakes(options: {
    days?: number;
    minMagnitude?: number;
    limit?: number;
  } = {}): Promise<DisasterLocation[]> {
    try {
      const days = options.days || 7;
      const minMagnitude = options.minMagnitude || 4.5;
      const limit = options.limit || 500;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const params = this.buildQueryParams({
        starttime: startDate.toISOString(),
        endtime: endDate.toISOString(),
        minmagnitude: minMagnitude,
        limit
      });
      
      const response = await fetch(`${this.BASE_URL}/query?${params}`);
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status} ${response.statusText}`);
      }
      
      const data: USGSEarthquakeResponse = await response.json();
      
      if (!data.features || !Array.isArray(data.features)) {
        console.warn('Invalid USGS response format');
        return [];
      }
      
      const disasters: DisasterLocation[] = [];
      
      for (const feature of data.features) {
        const disaster = this.convertToDisasterLocation(feature);
        if (disaster) {
          disasters.push(disaster);
        }
      }
      
      console.log(`Loaded ${disasters.length} earthquakes (M${minMagnitude}+, last ${days} days) from USGS`);
      return disasters;
      
    } catch (error) {
      console.error('Error fetching USGS earthquake data:', error);
      return [];
    }
  }
  
  // Fetch significant earthquakes (magnitude 6+)
  static async fetchSignificantEarthquakes(days: number = 30): Promise<DisasterLocation[]> {
    return this.fetchRecentEarthquakes({
      days,
      minMagnitude: 6.0,
      limit: 1000
    });
  }
}