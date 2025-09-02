import type { DisasterLocation } from '../types/disaster';

interface MergerStats {
  totalEvents: number;
  duplicatesRemoved: number;
  sourceBreakdown: { [source: string]: number };
  typeBreakdown: { [type: string]: number };
}

export class DisasterMerger {
  // Calculate distance between two points in kilometers
  private static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // Calculate time difference in hours
  private static calculateTimeDifference(date1: Date, date2: Date): number {
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
  }
  
  // Check if two disasters are likely duplicates
  private static areDuplicates(disaster1: DisasterLocation, disaster2: DisasterLocation): boolean {
    // Don't compare disasters from the same source
    if (disaster1.source === disaster2.source) {
      return false;
    }
    
    // Must be the same type of disaster
    if (disaster1.type !== disaster2.type) {
      return false;
    }
    
    // Calculate geographic distance
    const distance = this.calculateDistance(
      disaster1.latitude,
      disaster1.longitude,
      disaster2.latitude,
      disaster2.longitude
    );
    
    // Calculate time difference
    const timeDiff = this.calculateTimeDifference(disaster1.date, disaster2.date);
    
    // Different thresholds for different disaster types
    let maxDistance: number;
    let maxTimeDiff: number;
    
    switch (disaster1.type) {
      case 'earthquake':
        // Earthquakes are very precise in location and time
        maxDistance = 50; // 50 km
        maxTimeDiff = 24; // 24 hours
        break;
      case 'volcano':
        // Volcanoes are location-specific but can be active for long periods
        maxDistance = 20; // 20 km
        maxTimeDiff = 168; // 7 days
        break;
      case 'wildfire':
        // Wildfires can spread over large areas
        maxDistance = 100; // 100 km
        maxTimeDiff = 72; // 3 days
        break;
      case 'hurricane':
      case 'storm':
        // Storms move and affect large areas
        maxDistance = 200; // 200 km
        maxTimeDiff = 48; // 2 days
        break;
      case 'flood':
        // Floods can affect large areas
        maxDistance = 100; // 100 km
        maxTimeDiff = 72; // 3 days
        break;
      default:
        // Conservative defaults for other types
        maxDistance = 50; // 50 km
        maxTimeDiff = 48; // 2 days
        break;
    }
    
    // Consider it a duplicate if within distance and time thresholds
    return distance <= maxDistance && timeDiff <= maxTimeDiff;
  }
  
  // Choose the better disaster record when merging duplicates
  private static chooseBetterRecord(disaster1: DisasterLocation, disaster2: DisasterLocation): DisasterLocation {
    // Priority order: USGS > NASA EONET > EM-DAT for data quality
    const sourcePriority: { [source: string]: number } = {
      'USGS': 3,
      'NASA EONET': 2,
      'EM-DAT': 1
    };
    
    const priority1 = sourcePriority[disaster1.source || ''] || 0;
    const priority2 = sourcePriority[disaster2.source || ''] || 0;
    
    // If same priority, choose the one with more information
    if (priority1 === priority2) {
      const score1 = this.calculateInformationScore(disaster1);
      const score2 = this.calculateInformationScore(disaster2);
      return score1 >= score2 ? disaster1 : disaster2;
    }
    
    return priority1 > priority2 ? disaster1 : disaster2;
  }
  
  // Calculate how much information a disaster record contains
  private static calculateInformationScore(disaster: DisasterLocation): number {
    let score = 0;
    
    // Basic required fields
    if (disaster.name && disaster.name.trim()) score += 1;
    if (disaster.summary && disaster.summary.trim()) score += 2;
    if (disaster.affectedPeople > 0) score += 1;
    if (disaster.magnitude) score += 1;
    if (disaster.sourceUrl) score += 1;
    if (disaster.imageUrl) score += 1;
    if (disaster.donationLinks && disaster.donationLinks.length > 0) score += 2;
    
    // Length of summary indicates detail level
    if (disaster.summary && disaster.summary.length > 50) score += 1;
    if (disaster.summary && disaster.summary.length > 100) score += 1;
    
    return score;
  }
  
  // Merge disaster arrays and remove duplicates
  static mergeDisasters(
    ...disasterArrays: DisasterLocation[][]
  ): { disasters: DisasterLocation[]; stats: MergerStats } {
    // Flatten all arrays
    const allDisasters = disasterArrays.flat();
    
    const stats: MergerStats = {
      totalEvents: allDisasters.length,
      duplicatesRemoved: 0,
      sourceBreakdown: {},
      typeBreakdown: {}
    };
    
    // Track source and type statistics
    allDisasters.forEach(disaster => {
      const source = disaster.source || 'Unknown';
      const type = disaster.type;
      
      stats.sourceBreakdown[source] = (stats.sourceBreakdown[source] || 0) + 1;
      stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
    });
    
    const uniqueDisasters: DisasterLocation[] = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < allDisasters.length; i++) {
      if (processed.has(allDisasters[i].id)) continue;
      
      const currentDisaster = allDisasters[i];
      let bestDisaster = currentDisaster;
      const duplicateIndices: number[] = [i];
      
      // Look for duplicates in remaining disasters
      for (let j = i + 1; j < allDisasters.length; j++) {
        if (processed.has(allDisasters[j].id)) continue;
        
        if (this.areDuplicates(currentDisaster, allDisasters[j])) {
          duplicateIndices.push(j);
          
          // Choose the better record
          bestDisaster = this.chooseBetterRecord(bestDisaster, allDisasters[j]);
        }
      }
      
      // Mark all duplicates as processed
      duplicateIndices.forEach(index => {
        processed.add(allDisasters[index].id);
      });
      
      // Add the best disaster to unique list
      uniqueDisasters.push(bestDisaster);
      
      // Update duplicate count
      if (duplicateIndices.length > 1) {
        stats.duplicatesRemoved += duplicateIndices.length - 1;
      }
    }
    
    // Sort by date (most recent first)
    uniqueDisasters.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log(`Merged ${stats.totalEvents} disasters into ${uniqueDisasters.length} unique events (removed ${stats.duplicatesRemoved} duplicates)`);
    console.log('Source breakdown:', stats.sourceBreakdown);
    console.log('Type breakdown:', stats.typeBreakdown);
    
    return {
      disasters: uniqueDisasters,
      stats
    };
  }
  
  // Validate disaster data before merging
  static validateDisaster(disaster: DisasterLocation): boolean {
    // Check required fields
    if (!disaster.id || !disaster.name || !disaster.type) {
      return false;
    }
    
    // Check coordinate validity
    if (isNaN(disaster.latitude) || isNaN(disaster.longitude)) {
      return false;
    }
    
    if (Math.abs(disaster.latitude) > 90 || Math.abs(disaster.longitude) > 180) {
      return false;
    }
    
    // Check date validity
    if (!disaster.date || isNaN(disaster.date.getTime())) {
      return false;
    }
    
    // Check if date is not in the future (with some tolerance)
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (disaster.date > oneWeekFromNow) {
      return false;
    }
    
    return true;
  }
  
  // Filter and clean disasters before merging
  static cleanDisasters(disasters: DisasterLocation[]): DisasterLocation[] {
    return disasters.filter(disaster => {
      if (!this.validateDisaster(disaster)) {
        console.warn(`Invalid disaster filtered out: ${disaster.id}`, disaster);
        return false;
      }
      return true;
    });
  }
  
  // Main method to merge disasters from multiple sources with full validation
  static mergeSources(
    emdatDisasters: DisasterLocation[] = [],
    eonetDisasters: DisasterLocation[] = [],
    usgsDisasters: DisasterLocation[] = []
  ): { disasters: DisasterLocation[]; stats: MergerStats } {
    
    // Clean each source
    const cleanEmdat = this.cleanDisasters(emdatDisasters);
    const cleanEonet = this.cleanDisasters(eonetDisasters);
    const cleanUsgs = this.cleanDisasters(usgsDisasters);
    
    console.log(`Cleaned disasters: EM-DAT (${cleanEmdat.length}), EONET (${cleanEonet.length}), USGS (${cleanUsgs.length})`);
    
    // Merge and deduplicate
    return this.mergeDisasters(cleanEmdat, cleanEonet, cleanUsgs);
  }
}