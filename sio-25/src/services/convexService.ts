// Service for handling Convex operations alongside API calls
import { 
  extractConvexId 
} from '../hooks/useConvexData';
import { disasterAPI } from './api';
import type { DisasterLocation } from '../types/disaster';

export class ConvexService {
  private useDirectConvex: boolean;

  constructor() {
    // Determine if we should use direct Convex or FastAPI
    this.useDirectConvex = !!import.meta.env.VITE_CONVEX_URL && 
                          !import.meta.env.VITE_API_URL;
  }

  async getDisasters(params: {
    page?: number;
    size?: number;
    disaster_type?: string;
    severity?: string;
    days_back?: number;
  } = {}) {
    if (this.useDirectConvex) {
      // Use Convex hooks directly
      // Note: This would need to be refactored to work outside of React component
      throw new Error('Direct Convex access not implemented in service layer');
    } else {
      // Use FastAPI
      return await disasterAPI.getDisasters(params);
    }
  }

  async triggerScraping(daysBack: number = 30) {
    if (this.useDirectConvex) {
      throw new Error('Direct Convex scraping not implemented in service layer');
    } else {
      return await disasterAPI.triggerDisasterScraping(daysBack);
    }
  }
}

// Utility functions
export function isConvexDisaster(disaster: DisasterLocation): boolean {
  return disaster.id.startsWith('convex-');
}

export function getConvexIdFromDisaster(disaster: DisasterLocation): string | undefined {
  return extractConvexId(disaster.id);
}

export const convexService = new ConvexService();