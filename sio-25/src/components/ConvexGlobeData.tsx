import { useState, useEffect, useCallback } from 'react';
import { useDisasters, useCreateScrapingJob, useScrapingStatus } from '../hooks/useConvexData';
import type { DisasterLocation } from '../types/disaster';
import { mockDisasters } from '../data/mockDisasters';

interface ConvexGlobeDataProps {
  onDisastersUpdate: (disasters: DisasterLocation[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onScrapingChange: (isActive: boolean) => void;
}

export default function ConvexGlobeData({ 
  onDisastersUpdate, 
  onLoadingChange, 
  onScrapingChange 
}: ConvexGlobeDataProps) {
  const [filters, setFilters] = useState({
    page: 1,
    size: 100,
    days_back: 90
  });

  // Convex hooks
  const disastersQuery = useDisasters(filters);
  const createScrapingJob = useCreateScrapingJob();
  const scrapingStatus = useScrapingStatus();

  // Update disasters when Convex data changes
  useEffect(() => {
    if (disastersQuery) {
      const allDisasters = [...mockDisasters, ...disastersQuery.disasters];
      onDisastersUpdate(allDisasters);
      onLoadingChange(false);
    } else {
      onLoadingChange(true);
    }
  }, [disastersQuery, onDisastersUpdate, onLoadingChange]);

  // Monitor scraping status
  useEffect(() => {
    if (scrapingStatus) {
      const isActive = scrapingStatus.status === 'running' || scrapingStatus.status === 'pending';
      onScrapingChange(isActive);
    }
  }, [scrapingStatus, onScrapingChange]);

  // Function to trigger scraping
  const handleTriggerScraping = useCallback(async (daysBack: number = 30) => {
    try {
      onScrapingChange(true);
      await createScrapingJob({
        job_type: "disasters",
        days_back: daysBack
      });
      
      // The scraping status will update via the hook
      setTimeout(() => {
        // Refresh data after some time
        setFilters(prev => ({ ...prev, page: prev.page })); // Trigger refresh
      }, 5000);
      
    } catch (error) {
      console.error('Error triggering scraping:', error);
      onScrapingChange(false);
    }
  }, [createScrapingJob, onScrapingChange, setFilters]);

  // Expose the trigger function to parent
  useEffect(() => {
    // Store the function on window for parent access (temporary solution)
    (window as Record<string, unknown>).triggerConvexScraping = handleTriggerScraping;
    
    return () => {
      delete (window as Record<string, unknown>).triggerConvexScraping;
    };
  }, [handleTriggerScraping]);

  // This component doesn't render anything visible
  return null;
}