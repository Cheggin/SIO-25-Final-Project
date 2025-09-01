import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { DisasterLocation, DonationLink } from "../types/disaster";

// Real Convex hooks - now that Convex is configured

export function useDisasters(filters: {
  page?: number;
  size?: number;
  disaster_type?: string;
  severity?: string;
  days_back?: number;
} = {}) {
  const result = useQuery(api.disasters.getDisasters, filters);
  
  // Convert Convex data to our local types
  return result ? {
    ...result,
    disasters: result.disasters.map(convertConvexToDisasterLocation)
  } : undefined;
}

export function useDisaster(id: Id<"disasters"> | undefined) {
  const result = useQuery(api.disasters.getDisaster, id ? { id } : "skip");
  return result ? convertConvexToDisasterLocation(result) : undefined;
}

export function useDisasterTypes() {
  return useQuery(api.disasters.getDisasterTypes);
}

export function useDisasterSeverities() {
  return useQuery(api.disasters.getDisasterSeverities);
}

export function useSearchDisasters(searchQuery: string, page = 1, size = 50) {
  const result = useQuery(
    api.disasters.searchDisasters, 
    searchQuery ? { query: searchQuery, page, size } : "skip"
  );
  
  return result ? {
    ...result,
    disasters: result.disasters.map(convertConvexToDisasterLocation)
  } : undefined;
}

export function useDisasterDonations(disasterId: Id<"disasters"> | undefined) {
  const result = useQuery(
    api.donations.getDisasterDonations,
    disasterId ? { disaster_id: disasterId } : "skip"
  );
  
  return result?.map(convertConvexToDonationLink);
}

export function useScrapingStatus() {
  return useQuery(api.scraping.getScrapingStatus);
}

// Mutations
export function useCreateDisaster() {
  return useMutation(api.disasters.createDisaster);
}

export function useCreateDonationLink() {
  return useMutation(api.donations.createDonationLink);
}

export function useCreateScrapingJob() {
  return useMutation(api.scraping.createScrapingJob);
}

export function useUpdateScrapingJob() {
  return useMutation(api.scraping.updateScrapingJob);
}

// Utility functions to convert between Convex and local types
function convertConvexToDisasterLocation(convexDisaster: Record<string, unknown>): DisasterLocation {
  return {
    id: `convex-${convexDisaster._id}`,
    name: convexDisaster.name,
    type: convexDisaster.type,
    severity: convexDisaster.severity,
    latitude: convexDisaster.latitude,
    longitude: convexDisaster.longitude,
    date: new Date(convexDisaster.date),
    affectedPeople: convexDisaster.affected_people || 0,
    summary: convexDisaster.description || 'No description available',
    donationLinks: [], // Will be loaded separately
    source: convexDisaster.source_url,
    imageUrl: convexDisaster.image_url,
  };
}

function convertConvexToDonationLink(convexDonation: Record<string, unknown>): DonationLink {
  return {
    organization: convexDonation.organization_name,
    url: convexDonation.donation_url,
    description: convexDonation.description || 'Supporting disaster relief efforts',
  };
}

// Helper to extract Convex ID from our composite ID
export function extractConvexId(compositeId: string): Id<"disasters"> | undefined {
  if (compositeId.startsWith('convex-')) {
    return compositeId.replace('convex-', '') as Id<"disasters">;
  }
  return undefined;
}