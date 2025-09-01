import * as XLSX from 'xlsx';
import type { DisasterLocation } from '../types/disaster';

export interface EmdatRow {
  'DisNo.'?: string;
  'Year'?: number;
  'Seq'?: string;
  'Glide'?: string;
  'Disaster Group'?: string;
  'Disaster Subgroup'?: string;
  'Disaster Type'?: string;
  'Disaster Subtype'?: string;
  'Event Name'?: string;
  'Country'?: string;
  'ISO'?: string;
  'Region'?: string;
  'Continent'?: string;
  'Location'?: string;
  'Origin'?: string;
  'Associated Dis'?: string;
  'Associated Dis2'?: string;
  'OFDA Response'?: string;
  'Appeal'?: string;
  'Declaration'?: string;
  'AID Contribution'?: string;
  'Dis Mag Value'?: number;
  'Dis Mag Scale'?: string;
  'Latitude'?: number;
  'Longitude'?: number;
  'Local Time'?: string;
  'River Basin'?: string;
  'Start Year'?: number;
  'Start Month'?: number;
  'Start Day'?: number;
  'End Year'?: number;
  'End Month'?: number;
  'End Day'?: number;
  'Total Deaths'?: number;
  'No Injured'?: number;
  'No Affected'?: number;
  'No Homeless'?: number;
  'Total Affected'?: number;
  'Reconstruction Costs (\'000 US$)'?: number;
  'Insured Losses (\'000 US$)'?: number;
  'Total Losses (\'000 US$)'?: number;
  'CPI'?: number;
}

export class EmdatService {
  private static mapDisasterType(emdatType?: string): DisasterLocation['type'] {
    if (!emdatType) return 'other';
    
    const type = emdatType.toLowerCase();
    if (type.includes('flood')) return 'flood';
    if (type.includes('wildfire') || type.includes('forest fire')) return 'wildfire';
    if (type.includes('hurricane') || type.includes('cyclone') || type.includes('typhoon')) return 'hurricane';
    if (type.includes('drought')) return 'drought';
    if (type.includes('heat') || type.includes('temperature')) return 'heatwave';
    if (type.includes('storm') || type.includes('wind')) return 'storm';
    if (type.includes('earthquake') || type.includes('seismic')) return 'earthquake';
    return 'other';
  }

  private static calculateSeverity(affected?: number, deaths?: number): DisasterLocation['severity'] {
    const totalAffected = (affected || 0) + (deaths || 0) * 10; // Weight deaths more heavily
    
    if (totalAffected >= 1000000) return 'critical';
    if (totalAffected >= 100000) return 'high';
    if (totalAffected >= 10000) return 'moderate';
    return 'low';
  }

  private static createDate(year?: number, month?: number, day?: number): Date {
    if (!year) return new Date();
    return new Date(year, (month || 1) - 1, day || 1);
  }

  private static generateSummary(row: EmdatRow): string {
    const parts: string[] = [];
    
    if (row['Disaster Type']) {
      parts.push(`${row['Disaster Type']} disaster`);
    }
    
    if (row['Location']) {
      parts.push(`in ${row['Location']}`);
    } else if (row['Country']) {
      parts.push(`in ${row['Country']}`);
    }

    if (row['Total Affected']) {
      parts.push(`affecting ${row['Total Affected'].toLocaleString()} people`);
    }

    if (row['Total Deaths']) {
      parts.push(`with ${row['Total Deaths'].toLocaleString()} casualties`);
    }

    return parts.length > 0 ? parts.join(' ') + '.' : 'Natural disaster event.';
  }

  static async loadFromFile(filePath: string): Promise<DisasterLocation[]> {
    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: EmdatRow[] = XLSX.utils.sheet_to_json(worksheet);

      return this.processEmdatData(jsonData);
    } catch (error) {
      console.error('Error loading EMDAT file:', error);
      return [];
    }
  }

  static processEmdatData(data: EmdatRow[]): DisasterLocation[] {
    const disasters: DisasterLocation[] = [];

    data.forEach((row, index) => {
      // Filter out rows without valid coordinates
      if (!row.Latitude || !row.Longitude || 
          isNaN(row.Latitude) || isNaN(row.Longitude) ||
          row.Latitude === 0 || row.Longitude === 0) {
        return;
      }

      const disaster: DisasterLocation = {
        id: row['DisNo.'] || `emdat-${index}`,
        name: row['Event Name'] || `${row['Disaster Type']} in ${row['Country']}` || `Disaster ${index + 1}`,
        type: this.mapDisasterType(row['Disaster Type']),
        latitude: row.Latitude,
        longitude: row.Longitude,
        date: this.createDate(row['Start Year'], row['Start Month'], row['Start Day']),
        severity: this.calculateSeverity(row['Total Affected'], row['Total Deaths']),
        affectedPeople: row['Total Affected'] || 0,
        summary: this.generateSummary(row),
        donationLinks: [], // Will be populated when clicked
        source: 'EM-DAT',
      };

      disasters.push(disaster);
    });

    return disasters;
  }

  static async loadFromUrl(url: string): Promise<DisasterLocation[]> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: EmdatRow[] = XLSX.utils.sheet_to_json(worksheet);

      return this.processEmdatData(jsonData);
    } catch (error) {
      console.error('Error loading EMDAT data from URL:', error);
      return [];
    }
  }
}