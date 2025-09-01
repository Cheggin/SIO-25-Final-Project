import axios from 'axios';
import { DisasterLocation, DonationLink } from '../types/disaster';

interface BrowserUseConfig {
  apiKey?: string;
  endpoint?: string;
}

interface ScrapedDisasterData {
  title: string;
  location: string;
  date: string;
  summary: string;
  affectedPeople?: number;
  donationLinks?: Array<{
    organization: string;
    url: string;
    description: string;
  }>;
  imageUrl?: string;
  source?: string;
}

export class BrowserUseAgent {
  private config: BrowserUseConfig;

  constructor(config: BrowserUseConfig = {}) {
    this.config = {
      apiKey: config.apiKey || import.meta.env.VITE_BROWSER_USE_API_KEY,
      endpoint: config.endpoint || import.meta.env.VITE_BROWSER_USE_ENDPOINT || 'http://localhost:3000',
    };
  }

  async scrapeDisasterData(url: string): Promise<ScrapedDisasterData | null> {
    try {
      const response = await axios.post(
        `${this.config.endpoint}/scrape`,
        {
          url,
          instructions: `
            Extract the following information about the climate disaster:
            1. Title/Name of the disaster
            2. Location (with coordinates if available)
            3. Date of occurrence
            4. Summary of the event (2-3 sentences)
            5. Number of people affected (if mentioned)
            6. Any donation links or relief organizations mentioned
            7. Main image URL
            8. Source attribution
            
            Return as structured JSON.
          `,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error scraping disaster data:', error);
      return null;
    }
  }

  async searchRecentDisasters(): Promise<DisasterLocation[]> {
    const searchUrls = [
      'https://reliefweb.int/disasters',
      'https://www.gdacs.org/default.aspx',
      'https://disasterphilanthropy.org/our-approach/disasters/',
    ];

    const disasters: DisasterLocation[] = [];

    for (const url of searchUrls) {
      try {
        const response = await axios.post(
          `${this.config.endpoint}/search`,
          {
            url,
            query: 'recent climate disasters 2024',
            instructions: `
              Find and extract information about recent climate-related disasters.
              For each disaster, extract:
              - Name and type of disaster
              - Location with approximate coordinates
              - Date
              - Severity level
              - Number of affected people
              - Brief summary
              - Any donation/relief organization links
            `,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && Array.isArray(response.data)) {
          const parsedDisasters = response.data.map((item: unknown) => 
            this.parseToDisasterLocation(item)
          ).filter(Boolean);
          
          disasters.push(...parsedDisasters);
        }
      } catch (error) {
        console.error(`Error searching disasters from ${url}:`, error);
      }
    }

    return disasters;
  }

  async getDonationLinks(disasterName: string, location: string): Promise<DonationLink[]> {
    try {
      const response = await axios.post(
        `${this.config.endpoint}/search`,
        {
          query: `${disasterName} ${location} donation relief organizations help`,
          instructions: `
            Find legitimate donation and relief organizations helping with this disaster.
            For each organization, extract:
            - Organization name
            - Donation URL
            - Brief description of their relief efforts
            
            Only include verified, legitimate organizations.
          `,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        return response.data.map((item: unknown) => ({
          organization: (item as Record<string, unknown>).organization as string || 'Relief Organization',
          url: (item as Record<string, unknown>).url as string || '#',
          description: (item as Record<string, unknown>).description as string || 'Supporting disaster relief efforts',
        }));
      }
    } catch (error) {
      console.error('Error fetching donation links:', error);
    }

    return this.getDefaultDonationLinks();
  }

  private parseToDisasterLocation(data: unknown): DisasterLocation | null {
    try {
      const parsedData = data as Record<string, unknown>;
      return {
        id: `disaster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: (parsedData.title as string) || (parsedData.name as string) || 'Unknown Disaster',
        type: this.inferDisasterType((parsedData.title as string) || (parsedData.description as string) || ''),
        latitude: this.parseCoordinate(parsedData.latitude) || this.estimateLatitude((parsedData.location as string) || ''),
        longitude: this.parseCoordinate(parsedData.longitude) || this.estimateLongitude((parsedData.location as string) || ''),
        date: new Date((parsedData.date as string) || Date.now()),
        severity: this.inferSeverity(parsedData),
        affectedPeople: parseInt((parsedData.affectedPeople as string) || '0') || 0,
        summary: (parsedData.summary as string) || (parsedData.description as string) || 'No description available',
        donationLinks: (parsedData.donationLinks as DonationLink[]) || [],
        source: parsedData.source as string,
        imageUrl: parsedData.imageUrl as string,
      };
    } catch (error) {
      console.error('Error parsing disaster data:', error);
      return null;
    }
  }

  private inferDisasterType(text: string): DisasterLocation['type'] {
    const lowercased = text.toLowerCase();
    if (lowercased.includes('fire') || lowercased.includes('wildfire')) return 'wildfire';
    if (lowercased.includes('flood')) return 'flood';
    if (lowercased.includes('hurricane') || lowercased.includes('cyclone') || lowercased.includes('typhoon')) return 'hurricane';
    if (lowercased.includes('drought')) return 'drought';
    if (lowercased.includes('heat') || lowercased.includes('heatwave')) return 'heatwave';
    if (lowercased.includes('storm') || lowercased.includes('tornado')) return 'storm';
    if (lowercased.includes('earthquake') || lowercased.includes('quake')) return 'earthquake';
    return 'other';
  }

  private inferSeverity(data: Record<string, unknown>): DisasterLocation['severity'] {
    const affectedPeople = parseInt((data.affectedPeople as string) || '0') || 0;
    if (affectedPeople > 1000000 || data.severity === 'critical') return 'critical';
    if (affectedPeople > 100000 || data.severity === 'high') return 'high';
    if (affectedPeople > 10000 || data.severity === 'moderate') return 'moderate';
    return 'low';
  }

  private parseCoordinate(value: unknown): number | null {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  private estimateLatitude(location: string): number {
    const locationMap: { [key: string]: number } = {
      'usa': 39.8283,
      'canada': 56.1304,
      'brazil': -14.2350,
      'australia': -25.2744,
      'india': 20.5937,
      'china': 35.8617,
      'europe': 54.5260,
      'africa': -8.7832,
    };

    const lowercased = location.toLowerCase();
    for (const [key, lat] of Object.entries(locationMap)) {
      if (lowercased.includes(key)) return lat;
    }
    
    return (Math.random() - 0.5) * 180;
  }

  private estimateLongitude(location: string): number {
    const locationMap: { [key: string]: number } = {
      'usa': -98.5795,
      'canada': -106.3468,
      'brazil': -47.9292,
      'australia': 133.7751,
      'india': 78.9629,
      'china': 104.1954,
      'europe': 15.2551,
      'africa': 34.5085,
    };

    const lowercased = location.toLowerCase();
    for (const [key, lon] of Object.entries(locationMap)) {
      if (lowercased.includes(key)) return lon;
    }
    
    return (Math.random() - 0.5) * 360;
  }

  private getDefaultDonationLinks(): DonationLink[] {
    return [
      {
        organization: 'Red Cross',
        url: 'https://www.redcross.org/donate/donation.html',
        description: 'Supporting disaster relief and recovery efforts worldwide',
      },
      {
        organization: 'Direct Relief',
        url: 'https://www.directrelief.org/emergency/',
        description: 'Providing medical assistance to improve health and lives',
      },
      {
        organization: 'GlobalGiving',
        url: 'https://www.globalgiving.org/disaster-relief/',
        description: 'Connecting donors with grassroots projects around the world',
      },
    ];
  }
}