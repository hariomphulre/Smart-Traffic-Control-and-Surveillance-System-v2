import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Separate Time Frame Selector component to be used in Card.Header
export const TimeFrameSelector = ({ activeTimeFrame, onTimeFrameChange }) => {
  return (
    <div className="time-frame-selector" style={{ padding: 0, background: 'transparent', borderBottom: 'none' }}>
      <div className="btn-group" role="group" aria-label="Time frame selector">
        <button 
          type="button" 
          className={`btn btn-sm ${activeTimeFrame === 'hourly' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onTimeFrameChange('hourly')}
        >
          Hours
        </button>
        <button 
          type="button" 
          className={`btn btn-sm ${activeTimeFrame === 'daily' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onTimeFrameChange('daily')}
        >
          Day
        </button>
        <button 
          type="button" 
          className={`btn btn-sm ${activeTimeFrame === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onTimeFrameChange('weekly')}
        >
          Week
        </button>
        <button 
          type="button" 
          className={`btn btn-sm ${activeTimeFrame === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onTimeFrameChange('monthly')}
        >
          Month
        </button>
        <button 
          type="button" 
          className={`btn btn-sm ${activeTimeFrame === 'yearly' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onTimeFrameChange('yearly')}
        >
          Year
        </button>
        <button 
          type="button" 
          className={`btn btn-sm ${activeTimeFrame === 'fulltime' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onTimeFrameChange('fulltime')}
        >
          Full Time
        </button>
      </div>
    </div>
  );
};

const TrafficVolumeChart = ({ vehicleData, timeFrame = 'hourly' }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [volumeStats, setVolumeStats] = useState({
    totalVehicles: 0,
    peakPeriod: '',
    averagePeriod: 0,
    trend: 'increasing' // increasing, decreasing, stable
  });
  const [activeTimeFrame, setActiveTimeFrame] = useState(timeFrame);
  
  const chartRef = useRef(null);

  // Update active time frame when prop changes
  useEffect(() => {
    setActiveTimeFrame(timeFrame);
  }, [timeFrame]);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          family: 'Roboto',
          weight: 'bold'
        },
        bodyFont: {
          size: 13,
          family: 'Roboto'
        },
        padding: 12,
        cornerRadius: 0, // Sharp edges
        callbacks: {
          label: function(context) {
            return `Vehicles: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Roboto',
            size: 11,
            weight: 'bold'
          },
          color: '#333',
          maxRotation: 45,
          minRotation: 45
        },
        title: {
          display: true,
          text: getXAxisTitle(),
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#666'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0,
          font: {
            family: 'Roboto',
            size: 11
          },
          color: '#333'
        },
        title: {
          display: true,
          text: 'Number of Vehicles',
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#666'
        }
      }
    }
  };

  // Helper function to get x-axis title based on active time frame
  function getXAxisTitle() {
    switch(activeTimeFrame) {
      case 'hourly': return 'Time of Day';
      case 'daily': return 'Day of Week';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
      case 'yearly': return 'Month of Year';
      case 'fulltime': return 'Time Period';
      default: return 'Time Period';
    }
  }
  
  // Generate simulated traffic volume data based on selected time frame
  const generateTimeFrameData = () => {
    switch(activeTimeFrame) {
      case 'hourly':
        return generateHourlyData();
      case 'daily':
        return generateDailyData();
      case 'weekly':
        return generateWeeklyData();
      case 'monthly':
        return generateMonthlyData();
      case 'yearly':
        return generateYearlyData();
      case 'fulltime':
        return generateFullTimeData();
      default:
        return generateHourlyData();
    }
  };

  // Generate hourly data (24-hour view)
  const generateHourlyData = () => {
    // Define time periods (24-hour format)
    const timeLabels = [
      '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];
    
    // Simulate traffic patterns (more traffic during morning/evening rush hours)
    const vehicleCounts = timeLabels.map(time => {
      const hour = parseInt(time.split(':')[0]);
      
      // Morning rush hour (6-9 AM)
      if (hour >= 6 && hour <= 9) {
        return Math.floor(Math.random() * 30) + 70; // 70-100 vehicles
      } 
      // Evening rush hour (4-7 PM)
      else if (hour >= 16 && hour <= 19) {
        return Math.floor(Math.random() * 40) + 60; // 60-100 vehicles
      }
      // Mid-day
      else if (hour >= 10 && hour <= 15) {
        return Math.floor(Math.random() * 30) + 40; // 40-70 vehicles
      }
      // Night time
      else {
        return Math.floor(Math.random() * 20) + 10; // 10-30 vehicles
      }
    });
    
    // Calculate stats
    const total = vehicleCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...vehicleCounts);
    const maxIndex = vehicleCounts.indexOf(maxCount);
    const peakPeriod = timeLabels[maxIndex];
    
    // Set volume statistics
    setVolumeStats({
      totalVehicles: total,
      peakPeriod: peakPeriod,
      averagePeriod: Math.round(total / timeLabels.length),
      trend: 'increasing' // This would be calculated from historical data in a real app
    });
    
    return {
      timeLabels,
      vehicleCounts
    };
  };

  // Generate daily data (7 days view)
  const generateDailyData = () => {
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Simulate traffic patterns (more traffic during weekdays)
    const vehicleCounts = dayLabels.map(day => {
      // Weekdays have more traffic
      if (day === 'Monday' || day === 'Friday') {
        return Math.floor(Math.random() * 200) + 900; // 900-1100 vehicles 
      } 
      else if (day === 'Saturday' || day === 'Sunday') {
        return Math.floor(Math.random() * 300) + 500; // 500-800 vehicles (weekends)
      }
      else {
        return Math.floor(Math.random() * 150) + 800; // 800-950 vehicles (mid-week)
      }
    });
    
    // Calculate stats
    const total = vehicleCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...vehicleCounts);
    const maxIndex = vehicleCounts.indexOf(maxCount);
    const peakPeriod = dayLabels[maxIndex];
    
    setVolumeStats({
      totalVehicles: total,
      peakPeriod: peakPeriod,
      averagePeriod: Math.round(total / dayLabels.length),
      trend: 'stable'
    });
    
    return {
      timeLabels: dayLabels,
      vehicleCounts
    };
  };

  // Generate weekly data (4 weeks view)
  const generateWeeklyData = () => {
    const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    // Simulate traffic patterns
    const vehicleCounts = weekLabels.map((week, index) => {
      // Random pattern with some trend
      const baseCount = 5000;
      const variance = Math.floor(Math.random() * 1000);
      return baseCount + variance + (index * 200); // Slight upward trend
    });
    
    // Calculate stats
    const total = vehicleCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...vehicleCounts);
    const maxIndex = vehicleCounts.indexOf(maxCount);
    const peakPeriod = weekLabels[maxIndex];
    
    setVolumeStats({
      totalVehicles: total,
      peakPeriod: peakPeriod,
      averagePeriod: Math.round(total / weekLabels.length),
      trend: 'increasing'
    });
    
    return {
      timeLabels: weekLabels,
      vehicleCounts
    };
  };

  // Generate monthly data (12 months view)
  const generateMonthlyData = () => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Simulate traffic patterns (seasonal variations)
    const vehicleCounts = monthLabels.map(month => {
      // Summer months have more traffic
      if (month === 'Jun' || month === 'Jul' || month === 'Aug') {
        return Math.floor(Math.random() * 5000) + 25000; // 25k-30k vehicles
      } 
      // Winter months have less traffic
      else if (month === 'Dec' || month === 'Jan' || month === 'Feb') {
        return Math.floor(Math.random() * 5000) + 15000; // 15k-20k vehicles
      }
      // Spring/Fall months are moderate
      else {
        return Math.floor(Math.random() * 5000) + 20000; // 20k-25k vehicles
      }
    });
    
    // Calculate stats
    const total = vehicleCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...vehicleCounts);
    const maxIndex = vehicleCounts.indexOf(maxCount);
    const peakPeriod = monthLabels[maxIndex];
    
    setVolumeStats({
      totalVehicles: total,
      peakPeriod: peakPeriod,
      averagePeriod: Math.round(total / monthLabels.length),
      trend: 'seasonal'
    });
    
    return {
      timeLabels: monthLabels,
      vehicleCounts
    };
  };

  // Generate yearly data (5 years view) 
  const generateYearlyData = () => {
    // Get current year and generate 5 years back
    const currentYear = new Date().getFullYear();
    const yearLabels = [];
    
    for (let i = 4; i >= 0; i--) {
      yearLabels.push((currentYear - i).toString());
    }
    
    // Simulate traffic patterns (increasing trend over years)
    const vehicleCounts = yearLabels.map((year, index) => {
      // Base traffic increases each year
      const baseCount = 200000 + (index * 50000); 
      const variance = Math.floor(Math.random() * 30000);
      return baseCount + variance;
    });
    
    // Calculate stats
    const total = vehicleCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...vehicleCounts);
    const maxIndex = vehicleCounts.indexOf(maxCount);
    const peakPeriod = yearLabels[maxIndex];
    
    setVolumeStats({
      totalVehicles: total,
      peakPeriod: peakPeriod,
      averagePeriod: Math.round(total / yearLabels.length),
      trend: 'increasing'
    });
    
    return {
      timeLabels: yearLabels,
      vehicleCounts
    };
  };

  // Generate fulltime data (comprehensive view across different time periods)
  const generateFullTimeData = () => {
    // Create a timeline that combines significant points from various time periods
    const timeLabels = ['Past', '2020', '2021', '2022', '2023', 'Current', 'Projected'];
    
    // Simulate traffic patterns with a comprehensive view
    const vehicleCounts = [
      Math.floor(Math.random() * 50000) + 150000,  // Past
      Math.floor(Math.random() * 30000) + 180000,  // 2020
      Math.floor(Math.random() * 40000) + 200000,  // 2021
      Math.floor(Math.random() * 50000) + 230000,  // 2022
      Math.floor(Math.random() * 60000) + 260000,  // 2023
      Math.floor(Math.random() * 70000) + 300000,  // Current
      Math.floor(Math.random() * 80000) + 350000,  // Projected
    ];
    
    // Calculate stats
    const total = vehicleCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...vehicleCounts);
    const maxIndex = vehicleCounts.indexOf(maxCount);
    const peakPeriod = timeLabels[maxIndex];
    
    setVolumeStats({
      totalVehicles: total,
      peakPeriod: peakPeriod,
      averagePeriod: Math.round(total / timeLabels.length),
      trend: 'increasing'
    });
    
    return {
      timeLabels,
      vehicleCounts
    };
  };
  
  // Update chart data when time frame changes
  useEffect(() => {
    const { timeLabels, vehicleCounts } = generateTimeFrameData();
    
    const formattedData = {
      labels: timeLabels,
      datasets: [
        {
          label: 'Traffic Volume',
          data: vehicleCounts,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#28a745',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        }
      ]
    };
    
    setChartData(formattedData);
  }, [activeTimeFrame, vehicleData]);
  
  // Handle time frame change
  const handleTimeFrameChange = (newTimeFrame) => {
    setActiveTimeFrame(newTimeFrame);
  };
  
  // Get the period label based on active time frame
  const getPeriodLabel = () => {
    switch(activeTimeFrame) {
      case 'hourly': return 'Hour';
      case 'daily': return 'Day';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
      case 'yearly': return 'Year';
      case 'fulltime': return 'Period';
      default: return 'Period';
    }
  };
  
  return (
    <div className="traffic-volume-container">
      <div className="traffic-stat-row">
        <div className="traffic-stat-box">
          <div className="traffic-stat-label">Total Vehicles</div>
          <div className="traffic-stat-value">{volumeStats.totalVehicles.toLocaleString()}</div>
        </div>
        <div className="traffic-stat-box">
          <div className="traffic-stat-label">Peak {getPeriodLabel()}</div>
          <div className="traffic-stat-value">{volumeStats.peakPeriod}</div>
        </div>
        <div className="traffic-stat-box">
          <div className="traffic-stat-label">Average Per {getPeriodLabel()}</div>
          <div className="traffic-stat-value">{volumeStats.averagePeriod.toLocaleString()}</div>
        </div>
      </div>
      <div className="chart-container" style={{ height: 'calc(100% - 60px)', width: '100%' }}>
        <Line 
          ref={chartRef}
          data={chartData} 
          options={options}
        />
      </div>
    </div>
  );
};

export default TrafficVolumeChart; 