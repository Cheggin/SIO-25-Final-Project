import type { DisasterLocation } from '../types/disaster';
import type { EONETResponse, EONETEvent } from '../types/apiTypes';

export class EONETService {
  private static readonly BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3';
  
  // Map EONET categories to our disaster types
  private static mapCategoryToType(categories: Array<{ id: string; title: string }>): DisasterLocation['type'] {
    if (!categories || categories.length === 0) return 'other';
    
    const category = categories[0].title.toLowerCase();
    
    if (category.includes('wildfire') || category.includes('fire')) return 'wildfire';
    if (category.includes('flood')) return 'flood';
    if (category.includes('storm') || category.includes('cyclone') || category.includes('hurricane') || category.includes('typhoon')) return 'hurricane';
    if (category.includes('drought')) return 'drought';
    if (category.includes('heat') || category.includes('temperature')) return 'heatwave';
    if (category.includes('earthquake') || category.includes('seismic')) return 'earthquake';
    if (category.includes('volcano')) return 'volcano';
    if (category.includes('snow') || category.includes('ice')) return 'storm';
    
    return 'other';
  }
  
  // Calculate severity based on event duration and category
  private static calculateSeverity(event: EONETEvent): DisasterLocation['severity'] {
    // If event has been active for a long time, it's likely more severe
    const startDate = new Date(event.geometry[0]?.date);
    const endDate = event.closed ? new Date(event.closed) : new Date();
    const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Volcanoes and earthquakes are inherently severe
    const type = this.mapCategoryToType(event.categories);
    if (type === 'volcano' || type === 'earthquake') {
      return durationDays > 7 ? 'critical' : 'high';
    }
    
    // For wildfires, longer duration means more severe
    if (type === 'wildfire') {
      if (durationDays > 30) return 'critical';
      if (durationDays > 14) return 'high';
      if (durationDays > 7) return 'moderate';
      return 'low';
    }
    
    // For other events
    if (durationDays > 60) return 'critical';
    if (durationDays > 30) return 'high';
    if (durationDays > 14) return 'moderate';
    return 'low';
  }
  
  // Generate a comprehensive summary for the event
  private static generateSummary(event: EONETEvent): string {
    const parts: string[] = [];
    const category = event.categories[0]?.title || 'Natural event';
    
    // Start with the event title
    parts.push(event.title);
    
    // Add status
    if (!event.closed) {
      parts.push('(Currently active)');
    } else {
      const endDate = new Date(event.closed);
      parts.push(`(Ended ${endDate.toLocaleDateString()})`);
    }
    
    // Add description if available
    if (event.description) {
      parts.push(event.description);
    } else {
      // Generate a description based on type
      const startDate = new Date(event.geometry[0]?.date);
      parts.push(`${category} detected on ${startDate.toLocaleDateString()}.`);
    }
    
    // Add magnitude information if available
    const magnitude = event.geometry[0]?.magnitudeValue;
    if (magnitude) {
      parts.push(`Magnitude: ${magnitude} ${event.geometry[0]?.magnitudeUnit || ''}`);
    }
    
    // Add source information
    if (event.sources && event.sources.length > 0) {
      parts.push(`Source: ${event.sources.map(s => s.id).join(', ')}`);
    }
    
    return parts.join(' ');
  }
  
  // Extract coordinates from EONET geometry
  private static extractCoordinates(geometry: EONETEvent['geometry']): { latitude: number; longitude: number } | null {
    if (!geometry || geometry.length === 0) return null;
    
    // Use the most recent geometry entry
    const latestGeometry = geometry[geometry.length - 1];
    
    if (latestGeometry.type === 'Point' && Array.isArray(latestGeometry.coordinates)) {
      const coords = latestGeometry.coordinates as number[];
      if (coords.length >= 2) {
        return {
          longitude: coords[0],
          latitude: coords[1]
        };
      }
    } else if (latestGeometry.type === 'Polygon' && Array.isArray(latestGeometry.coordinates)) {
      // For polygons, calculate the centroid
      const polygon = latestGeometry.coordinates as number[][];
      if (polygon.length > 0 && polygon[0].length >= 2) {
        // Simple centroid calculation
        let sumLat = 0, sumLon = 0, count = 0;
        for (const ring of polygon) {
          if (Array.isArray(ring) && ring.length >= 2) {
            sumLon += ring[0];
            sumLat += ring[1];
            count++;
          }
        }
        if (count > 0) {
          return {
            longitude: sumLon / count,
            latitude: sumLat / count
          };
        }
      }
    }
    
    return null;
  }
  
  // Validate if an event has minimum required data
  private static isValidEvent(event: EONETEvent): boolean {
    // Must have geometry with coordinates
    const coords = this.extractCoordinates(event.geometry);
    if (!coords) return false;
    
    // Must have valid coordinates
    if (isNaN(coords.latitude) || isNaN(coords.longitude)) return false;
    if (Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) return false;
    
    // Must have a title
    if (!event.title || event.title.trim().length === 0) return false;
    
    // Must have at least one category
    if (!event.categories || event.categories.length === 0) return false;
    
    // Must have a valid date
    if (!event.geometry[0]?.date) return false;
    const date = new Date(event.geometry[0].date);
    if (isNaN(date.getTime())) return false;
    
    return true;
  }
  
  // Convert EONET event to our DisasterLocation format
  private static convertToDisasterLocation(event: EONETEvent): DisasterLocation | null {
    // Validate event first
    if (!this.isValidEvent(event)) {
      console.warn(`Invalid EONET event skipped: ${event.id}`, event);
      return null;
    }
    
    const coords = this.extractCoordinates(event.geometry);
    if (!coords) return null;
    
    const date = new Date(event.geometry[0].date);
    const type = this.mapCategoryToType(event.categories);
    
    const disaster: DisasterLocation = {
      id: `eonet-${event.id}`,
      originalId: event.id,
      name: event.title,
      type,
      latitude: coords.latitude,
      longitude: coords.longitude,
      date,
      severity: this.calculateSeverity(event),
      affectedPeople: 0, // EONET doesn't provide this data
      summary: this.generateSummary(event),
      donationLinks: [],
      source: 'NASA EONET',
      sourceUrl: event.link,
      magnitude: event.geometry[0]?.magnitudeValue
    };
    
    return disaster;
  }
  
  // Fetch active events from EONET
  static async fetchActiveEvents(): Promise<DisasterLocation[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/events?status=open&limit=100`);
      
      if (!response.ok) {
        throw new Error(`EONET API error: ${response.status} ${response.statusText}`);
      }
      
      const data: EONETResponse = await response.json();
      
      if (!data.events || !Array.isArray(data.events)) {
        console.warn('Invalid EONET response format');
        return [];
      }
      
      const disasters: DisasterLocation[] = [];
      
      for (const event of data.events) {
        const disaster = this.convertToDisasterLocation(event);
        if (disaster) {
          disasters.push(disaster);
        }
      }
      
      console.log(`Loaded ${disasters.length} active events from NASA EONET`);
      return disasters;
      
    } catch (error) {
      console.error('Error fetching EONET data:', error);
      return [];
    }
  }
  
  // Fetch all recent events (both open and closed from last 30 days)
  static async fetchRecentEvents(days: number = 30): Promise<DisasterLocation[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const response = await fetch(`${this.BASE_URL}/events?start=${startDateStr}&limit=500`);
      
      if (!response.ok) {
        throw new Error(`EONET API error: ${response.status} ${response.statusText}`);
      }
      
      const data: EONETResponse = await response.json();
      
      if (!data.events || !Array.isArray(data.events)) {
        return [];
      }
      
      const disasters: DisasterLocation[] = [];
      
      for (const event of data.events) {
        const disaster = this.convertToDisasterLocation(event);
        if (disaster) {
          disasters.push(disaster);
        }
      }
      
      console.log(`Loaded ${disasters.length} recent events (last ${days} days) from NASA EONET`);
      return disasters;
      
    } catch (error) {
      console.error('Error fetching recent EONET data:', error);
      return [];
    }
  }
}