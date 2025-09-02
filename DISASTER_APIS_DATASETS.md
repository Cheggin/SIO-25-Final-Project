# Disaster APIs and Datasets with Geographic Coordinates

## APIs (Real-time Data)

### 1. **USGS Earthquake API**
- **URL**: https://earthquake.usgs.gov/fdsnws/event/1/
- **Features**: Real-time earthquake data with magnitude, depth, and coordinates
- **Example Request**: 
  ```
  https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2024-01-01&minmagnitude=5
  ```
- **Response Format**: GeoJSON with latitude/longitude

### 2. **NASA EONET (Earth Observatory Natural Event Tracker)**
- **URL**: https://eonet.gsfc.nasa.gov/api/v3/events
- **Features**: Active natural events (wildfires, storms, volcanoes)
- **Example Request**:
  ```
  https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires
  ```
- **Response Format**: JSON with geometry coordinates

### 3. **ReliefWeb API**
- **URL**: https://api.reliefweb.int/v1/
- **Features**: Humanitarian disasters since 1981
- **Example Request**:
  ```
  https://api.reliefweb.int/v1/disasters?appname=your-app&preset=latest&limit=100
  ```
- **Response Format**: JSON with country/region data

### 4. **NOAA Natural Hazards API**
- **URL**: https://www.ngdc.noaa.gov/hazel/view/swagger
- **Features**: Natural hazards data including storms, earthquakes, tsunamis
- **Authentication**: May require API key

### 5. **OpenWeatherMap Severe Weather Alerts**
- **URL**: https://openweathermap.org/api/one-call-3
- **Features**: Weather alerts with lat/lon coordinates
- **Example Request**:
  ```
  https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={API_KEY}
  ```
- **Authentication**: Requires API key

### 6. **GDELT Project**
- **URL**: https://api.gdeltproject.org/
- **Features**: Real-time global news monitoring of disasters
- **Special Feature**: Updates every 15 minutes with ReliefWeb integration

## Downloadable Datasets

### 1. **GDIS (Geocoded Disasters) Dataset**
- **Provider**: NASA SEDAC
- **URL**: https://sedac.ciesin.columbia.edu/data/set/pend-gdis-1960-2018/data-download
- **Coverage**: 39,953 locations for 9,924 disasters (1960-2018)
- **Format**: GIS polygons with centroid lat/lon coordinates
- **Features**: Extends EM-DAT with precise geographic data

### 2. **Humanitarian Data Exchange (HDX)**
- **URL**: https://data.humdata.org/dataset/
- **Formats**: CSV, JSON, Excel
- **Key Datasets**:
  - Natural disasters deaths: https://data.humdata.org/dataset/people-killed-in-natural-disasters
  - ReliefWeb disasters: Full disaster reports with locations
  - ACLED conflict data with coordinates
- **Coverage**: Global, frequently updated

### 3. **EM-DAT International Disaster Database**
- **Provider**: CRED/UC Louvain
- **URL**: https://www.emdat.be/
- **Coverage**: Global disasters from 1900 to present
- **Format**: Excel/CSV export
- **Note**: Registration required for full access

### 4. **OpenFEMA Datasets**
- **URL**: https://www.fema.gov/about/openfema/data-sets
- **API Endpoint**: https://www.fema.gov/api/open/v1/
- **Key Datasets**:
  - Disaster Declarations
  - Public Assistance Projects
  - Hazard Mitigation Grants
- **Format**: JSON, CSV, API access
- **Coverage**: USA only

### 5. **IBTrACS (Tropical Cyclones)**
- **Provider**: NOAA
- **URL**: https://www.ncei.noaa.gov/products/international-best-track-archive
- **Coverage**: Global tropical cyclones, historical to present
- **Format**: CSV, NetCDF, Shapefile
- **Features**: Complete tracks with lat/lon at 6-hour intervals

### 6. **Global Disaster Alert and Coordination System (GDACS)**
- **URL**: https://www.gdacs.org/
- **API**: RSS/CAP feeds available
- **Features**: Real-time alerts with impact estimates

## Integration Example (JavaScript/TypeScript)

```typescript
// Example: Fetching USGS Earthquake Data
async function fetchRecentEarthquakes() {
  const response = await fetch(
    'https://earthquake.usgs.gov/fdsnws/event/1/query?' +
    'format=geojson&starttime=2024-01-01&minmagnitude=4.5'
  );
  const data = await response.json();
  
  return data.features.map(feature => ({
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place,
    time: new Date(feature.properties.time),
    coordinates: {
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2]
    }
  }));
}

// Example: NASA EONET Events
async function fetchActiveWildfires() {
  const response = await fetch(
    'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open'
  );
  const data = await response.json();
  
  return data.events.map(event => ({
    id: event.id,
    title: event.title,
    category: event.categories[0].title,
    coordinates: event.geometry[0].coordinates
  }));
}
```

## Notes for Implementation

1. **Rate Limiting**: Most APIs have rate limits. Implement caching and throttling.
2. **Authentication**: Some APIs require API keys (OpenWeatherMap, some NOAA services)
3. **Data Formats**: 
   - APIs typically return JSON or GeoJSON
   - Datasets available in CSV, Excel, Shapefile formats
4. **Update Frequency**:
   - Real-time APIs: Minutes to hours
   - Datasets: Daily to annually
5. **Geographic Coverage**:
   - FEMA: USA only
   - Most others: Global coverage

## Recommended for Your Globe Visualization

Given your React/TypeScript globe application, consider:

1. **Primary Source**: NASA EONET for real-time events (fires, storms, volcanoes)
2. **Historical Data**: GDIS dataset for comprehensive historical coverage
3. **Earthquakes**: USGS API for real-time seismic activity
4. **Humanitarian Context**: ReliefWeb API for disaster impact information
5. **Backup/Enrichment**: HDX datasets for additional context and historical data