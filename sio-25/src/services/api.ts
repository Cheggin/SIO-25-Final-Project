const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api' 
  : 'http://localhost:8000/api';

export interface APIDisaster {
  id: number;
  name: string;
  type: string;
  severity: string;
  latitude: number;
  longitude: number;
  date: string;
  description?: string;
  affected_people: number;
  economic_damage: number;
  source_url?: string;
  image_url?: string;
  verified: boolean;
  last_updated: string;
  donations: APIDonationLink[];
}

export interface APIDonationLink {
  id: number;
  organization_name: string;
  donation_url: string;
  description?: string;
  verified: boolean;
}

export interface DisasterResponse {
  disasters: APIDisaster[];
  total: number;
  page: number;
  size: number;
}

export interface ScrapingResponse {
  message: string;
  status: string;
  days_back?: number;
  disaster_id?: number;
}

class DisasterAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Disaster endpoints
  async getDisasters(params: {
    page?: number;
    size?: number;
    disaster_type?: string;
    severity?: string;
    days_back?: number;
  } = {}): Promise<DisasterResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());
    if (params.disaster_type) searchParams.set('disaster_type', params.disaster_type);
    if (params.severity) searchParams.set('severity', params.severity);
    if (params.days_back) searchParams.set('days_back', params.days_back.toString());

    const queryString = searchParams.toString();
    const endpoint = `/disasters${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DisasterResponse>(endpoint);
  }

  async getDisaster(id: number): Promise<APIDisaster> {
    return this.request<APIDisaster>(`/disasters/${id}`);
  }

  async getDisasterTypes(): Promise<string[]> {
    return this.request<string[]>('/disasters/types');
  }

  async getDisasterSeverities(): Promise<string[]> {
    return this.request<string[]>('/disasters/severities');
  }

  async searchDisasters(
    query: string,
    page: number = 1,
    size: number = 50
  ): Promise<DisasterResponse> {
    return this.request<DisasterResponse>(
      `/disasters/search/${encodeURIComponent(query)}?page=${page}&size=${size}`
    );
  }

  async getDisasterDonations(id: number): Promise<APIDonationLink[]> {
    return this.request<APIDonationLink[]>(`/disasters/${id}/donations`);
  }

  // Scraping endpoints
  async triggerDisasterScraping(daysBack: number = 30): Promise<ScrapingResponse> {
    return this.request<ScrapingResponse>('/scrape/disasters', {
      method: 'POST',
      body: JSON.stringify({ days_back: daysBack }),
    });
  }

  async getScrapingStatus(): Promise<{
    status: string;
    last_scrape: string;
    disasters_scraped: number;
  }> {
    return this.request('/scrape/status');
  }

  async scrapeDisasterDonations(disasterId: number): Promise<ScrapingResponse> {
    return this.request<ScrapingResponse>(`/scrape/donations/${disasterId}`, {
      method: 'POST',
    });
  }
}

export const disasterAPI = new DisasterAPI();