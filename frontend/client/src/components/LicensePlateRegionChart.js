import React, { useEffect, useState } from 'react';

const LicensePlateRegionChart = ({ licenseData }) => {
  const [regionData, setRegionData] = useState([]);
  const [totalPlates, setTotalPlates] = useState(0);
  
  // Function to extract and process region data
  useEffect(() => {
    // Sample region codes for demonstration purposes
    const regionMap = {
      'MH': 'Maharashtra',
      'KA': 'Karnataka',
      'TN': 'Tamil Nadu',
      'AP': 'Andhra Pradesh',
      'DL': 'Delhi',
      'GJ': 'Gujarat',
      'UP': 'Uttar Pradesh',
      'OTH': 'Other'
    };
    
    // Generate sample license plate data if none is provided
    if (!licenseData || Object.keys(licenseData).length === 0) {
      // Create simulated license plate data
      const simulatedData = {};
      const regions = Object.keys(regionMap);
      
      for (let i = 0; i < 100; i++) {
        const regionCode = regions[Math.floor(Math.random() * (regions.length - 1))]; // Exclude 'OTH'
        const number = Math.floor(Math.random() * 9000) + 1000;
        simulatedData[`${regionCode}${number}`] = {
          region: regionCode,
          number: number
        };
      }
      
      // Process the simulated data
      processRegionData(simulatedData, regionMap);
    } else {
      // Process actual license data
      processRegionData(licenseData, regionMap);
    }
  }, [licenseData]);
  
  // Process the license data to extract region statistics
  const processRegionData = (data, regionMap) => {
    // Initialize counters for each region
    const regionCounts = {};
    Object.keys(regionMap).forEach(region => {
      regionCounts[region] = 0;
    });
    
    // Count plates by region
    let total = 0;
    Object.keys(data).forEach(plate => {
      // Assume the first 2 characters represent the region code
      const regionCode = plate.slice(0, 2).toUpperCase();
      
      if (regionMap[regionCode]) {
        regionCounts[regionCode]++;
      } else {
        regionCounts['OTH']++;
      }
      total++;
    });
    
    // Convert to array and sort by count (descending)
    const regionArray = Object.keys(regionCounts).map(code => ({
      code,
      name: regionMap[code],
      count: regionCounts[code],
      percentage: total > 0 ? Math.round((regionCounts[code] / total) * 100) : 0
    }));
    
    regionArray.sort((a, b) => b.count - a.count);
    
    setRegionData(regionArray);
    setTotalPlates(total);
  };
  
  // If no data, show placeholder
  if (totalPlates === 0) {
    return (
      <div className="license-plate-chart compact d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
        <div className="text-center text-muted">
          <i className="fas fa-id-card fa-3x mb-3"></i>
          <p>No license plate data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="license-plate-chart compact">
      <div className="region-header d-flex justify-content-between align-items-center">
        <div className="region-title">Region Distribution</div>
        <div className="total-plates">Total: {totalPlates}</div>
      </div>
      
      <div className="region-list">
        {regionData.map(region => (
          <div className="region-row" key={region.code}>
            <div className="region-name">{region.name}</div>
            <div className="region-bar-container">
              <div 
                className="region-bar" 
                style={{ 
                  width: `${region.percentage}%`,
                  backgroundColor: region.code === 'OTH' ? '#6c757d' : '#1976d2'
                }}
              ></div>
            </div>
            <div className="region-value">{region.count} ({region.percentage}%)</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LicensePlateRegionChart; 