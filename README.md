# Climate Crisis Tracker - SIO 25 Final Project

A comprehensive interactive web application for tracking and visualizing global natural disasters with a focus on climate change attribution and disaster relief resources.

## 🌍 Project Overview

This application was developed as a final project for **SIO 25 - Climate and Environmental Change** at UC San Diego. It provides an interactive platform for understanding the relationship between climate change and extreme weather events through real-time data visualization and scientific attribution analysis.

### Key Features

- **🌐 Interactive 3D Globe**: Visualize disasters worldwide on an interactive Earth model
- **📊 Multi-Source Data Integration**: Combines data from NASA EONET, EM-DAT, and USGS
- **📈 Climate Attribution Analysis**: Shows how 74% of extreme weather events are worsened by climate change
- **📋 Comprehensive Data Tables**: Sortable and filterable disaster records
- **💝 Donation Resources**: Links to major disaster relief organizations
- **🔍 Advanced Filtering**: Filter by disaster type, severity, date range, and more

## 🛠 Technical Stack

- **Frontend**: React 19 with TypeScript
- **3D Visualization**: globe.gl (built on Three.js)
- **Charts**: Recharts for data visualization
- **Styling**: CSS3 with modern glassmorphism effects
- **Build Tool**: Vite for fast development and builds
- **Data Processing**: Custom services for real-time API integration

## 📊 Data Sources

### Primary Data Sources
1. **NASA EONET (Earth Observatory Natural Event Tracker)**
   - Real-time natural disaster tracking
   - Active fires, storms, volcanoes, and more
   - API: `https://eonet.gsfc.nasa.gov/api/v3`

2. **EM-DAT (Emergency Events Database)**
   - Historical disaster records (2000-2025)
   - Comprehensive impact data including casualties and economic losses
   - Source: Centre for Research on the Epidemiology of Disasters (CRED)

3. **USGS Earthquake Hazards Program**
   - Real-time earthquake data (M4.5+)
   - Precise magnitude and location information
   - API: `https://earthquake.usgs.gov/fdsnws/event/1`

### Climate Attribution Data
- **Carbon Brief Attribution Studies**: Analysis of 735 extreme weather events showing 74% are worsened by climate change
- Source: https://interactive.carbonbrief.org/attribution-studies/
