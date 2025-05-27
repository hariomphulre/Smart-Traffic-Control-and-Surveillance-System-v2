import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SpeedDistributionChart = ({ speedData, timeFrame = 'hourly' }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [speedStats, setSpeedStats] = useState({
    averageSpeed: 0,
    maxSpeed: 0,
    speedingCount: 0,
    speedingPercentage: 0
  });
  
  const chartRef = useRef(null);
  
  // Chart.js options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: 'easeOutQuad'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(33, 33, 33, 0.8)',
        titleFont: {
          size: 13,
          family: 'Roboto',
          weight: 'bold'
        },
        bodyFont: {
          size: 12,
          family: 'Roboto'
        },
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Vehicles: ${context.raw} (${((context.raw / Object.keys(speedData).length) * 100).toFixed(1)}%)`;
          },
          title: function(context) {
            return `Speed: ${context[0].label} km/h`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Roboto',
            size: 11,
            weight: '500'
          },
          color: '#666'
        },
        title: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          precision: 0,
          font: {
            family: 'Roboto',
            size: 11
          },
          color: '#666',
          padding: 8
        },
        title: {
          display: false
        }
      }
    }
  };
  
  // Helper function to group speeds into ranges
  const groupSpeedRanges = (data) => {
    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
      '100+': 0
    };
    
    if (!data || Object.keys(data).length === 0) {
      return ranges;
    }
    
    // Calculate speed statistics
    let total = 0;
    let max = 0;
    let speedingCount = 0; // Count vehicles going over 80 km/h
    const speedLimit = 80;
    const vehicleCount = Object.keys(data).length;
    
    Object.values(data).forEach(speed => {
      // Update statistics
      total += speed;
      max = Math.max(max, speed);
      if (speed > speedLimit) {
        speedingCount++;
      }
      
      // Group speeds
      if (speed <= 20) {
        ranges['0-20']++;
      } else if (speed <= 40) {
        ranges['21-40']++;
      } else if (speed <= 60) {
        ranges['41-60']++;
      } else if (speed <= 80) {
        ranges['61-80']++;
      } else if (speed <= 100) {
        ranges['81-100']++;
      } else {
        ranges['100+']++;
      }
    });
    
    // Update speed statistics
    setSpeedStats({
      averageSpeed: vehicleCount > 0 ? Math.round(total / vehicleCount) : 0,
      maxSpeed: max,
      speedingCount: speedingCount,
      speedingPercentage: vehicleCount > 0 ? Math.round((speedingCount / vehicleCount) * 100) : 0
    });
    
    return ranges;
  };
  
  // Function to filter data based on timeFrame
  const filterDataByTimeFrame = (data, timeFrame) => {
    if (!data || Object.keys(data).length === 0) {
      return data;
    }
    
    const now = new Date();
    let filteredData = {};
    
    switch (timeFrame) {
      case 'hourly':
        // Last hour
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        Object.entries(data).forEach(([key, value]) => {
          // Simulate timestamp using the key (in real app, you'd use actual timestamps)
          const timestamp = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
          if (timestamp >= oneHourAgo) {
            filteredData[key] = value;
          }
        });
        break;
      case 'daily':
        // Last 24 hours
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        Object.entries(data).forEach(([key, value]) => {
          const timestamp = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000));
          if (timestamp >= oneDayAgo) {
            filteredData[key] = value;
          }
        });
        break;
      case 'weekly':
        // Last 7 days
        const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        Object.entries(data).forEach(([key, value]) => {
          const timestamp = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000));
          if (timestamp >= oneWeekAgo) {
            filteredData[key] = value;
          }
        });
        break;
      case 'monthly':
        // Last 30 days
        const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        Object.entries(data).forEach(([key, value]) => {
          const timestamp = new Date(now.getTime() - (Math.random() * 90 * 24 * 60 * 60 * 1000));
          if (timestamp >= oneMonthAgo) {
            filteredData[key] = value;
          }
        });
        break;
      case 'full':
      default:
        // All data
        filteredData = data;
    }
    
    // Ensure we have at least some data
    if (Object.keys(filteredData).length < 10) {
      // If not enough data in the filtered set, use all data
      return data;
    }
    
    return filteredData;
  };
  
  // Update chart data when speedData or timeFrame changes
  useEffect(() => {
    // Filter data based on time frame
    const filteredData = filterDataByTimeFrame(speedData, timeFrame);
    
    // Group filtered data into ranges
    const speedRanges = groupSpeedRanges(filteredData);
    
    // Create chart data object
    const chartData = {
      labels: Object.keys(speedRanges).map(range => range),
      datasets: [
        {
          data: Object.values(speedRanges),
          backgroundColor: Array(Object.keys(speedRanges).length).fill('rgba(25, 118, 210, 0.7)'),
          borderColor: Array(Object.keys(speedRanges).length).fill('rgba(25, 118, 210, 1)'),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          hoverBackgroundColor: Array(Object.keys(speedRanges).length).fill('rgba(25, 118, 210, 0.9)'),
          hoverBorderColor: Array(Object.keys(speedRanges).length).fill('rgba(25, 118, 210, 1)'),
          hoverBorderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.85
        }
      ]
    };
    
    setChartData(chartData);
  }, [speedData, timeFrame]);
  
  // Check if there's any real data
  const hasData = speedData && Object.keys(speedData).length > 0;
  
  // Show placeholder if no data is available
  if (!hasData) {
    return (
      <div className="speed-distribution-chart compact d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
        <div className="text-center text-muted">
          <i className="fas fa-tachometer-alt fa-3x mb-3"></i>
          <p>No speed data available. Upload data to see speed distribution.</p>
        </div>
      </div>
    );
  }
  
  // Display time frame label
  const getTimeFrameLabel = () => {
    switch(timeFrame) {
      case 'hourly': return 'Last Hour';
      case 'daily': return 'Last 24 Hours';
      case 'weekly': return 'Last 7 Days';
      case 'monthly': return 'Last 30 Days';
      case 'full': return 'All Time';
      default: return 'Last Hour';
    }
  };
  
  return (
    <div className="speed-distribution-chart compact">
      <div className="stats-header-row">
        <div className="stat-header-box">
          <div className="stat-header-label">AVERAGE SPEED</div>
          <div className="stat-header-value avg-speed">{speedStats.averageSpeed}<span className="stat-unit">km/h</span></div>
        </div>
        <div className="stat-header-box">
          <div className="stat-header-label">MAX SPEED</div>
          <div className="stat-header-value max-speed">{speedStats.maxSpeed}<span className="stat-unit">km/h</span></div>
        </div>
        <div className="stat-header-box">
          <div className="stat-header-label">SPEEDING</div>
          <div className="stat-header-value speeding">{speedStats.speedingPercentage}<span className="stat-unit">%</span></div>
        </div>
      </div>
      
      <div className="info-row">
        <div className="info-box">
          <span className="info-label">VEHICLES</span>
          <span className="info-value">{Object.keys(speedData).length}</span>
        </div>
        <div className="info-box">
          <span className="info-label">RANGE</span>
          <span className="info-value">{speedStats.maxSpeed - speedStats.averageSpeed}<span className="stat-unit">km/h</span></span>
        </div>
        <div className="time-frame-info">
          <div className="time-frame-label">{getTimeFrameLabel()}</div>
        </div>
      </div>
      
      <div className="speed-chart-container">
        <Bar 
          ref={chartRef}
          data={chartData} 
          options={options}
        />
      </div>
    </div>
  );
};

export default SpeedDistributionChart; 