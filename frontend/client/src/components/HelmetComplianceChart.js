import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const HelmetComplianceChart = ({ helmetData, timeFrame = 'hourly' }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  
  // Generate timestamps based on time frame
  const generateTimeLabels = () => {
    const labels = [];
    const now = new Date();
    
    let count = 24; // Default for hourly
    let format = { hour: '2-digit', minute: '2-digit' }; // Default format
    let stepHours = 1; // Default step
    
    // Adjust based on time frame
    switch(timeFrame) {
      case 'daily':
        count = 24;
        stepHours = 1;
        format = { hour: '2-digit', minute: '2-digit' };
        break;
      case 'weekly':
        count = 7;
        stepHours = 24;
        format = { weekday: 'short' };
        break;
      case 'monthly':
        count = 30;
        stepHours = 24;
        format = { month: 'short', day: 'numeric' };
        break;
      case 'full':
        count = 12;
        stepHours = 24 * 30;
        format = { month: 'short' };
        break;
      case 'hourly':
      default:
        count = 24;
        stepHours = 1;
        format = { hour: '2-digit', minute: '2-digit' };
    }
    
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - (i * stepHours));
      labels.push(time.toLocaleTimeString([], format));
    }
    
    return labels;
  };
  
  // Initialize with compliance history data based on time frame
  const [complianceHistory, setComplianceHistory] = useState(() => {
    // Generate time labels
    const labels = generateTimeLabels();
    
    // Initialize with randomized compliance data
    const withHelmet = Array(labels.length).fill(0).map(() => 
      Math.floor(Math.random() * 40) + 60); // Random values between 60-100% for demo
    
    return {
      labels,
      withHelmet
    };
  });
  
  // Update compliance history when helmet data or time frame changes
  useEffect(() => {
    if (!helmetData || Object.keys(helmetData).length === 0) {
      // Generate dummy data for demonstration
      const labels = generateTimeLabels();
      const withHelmet = Array(labels.length).fill(0).map(() => 
        Math.floor(Math.random() * 40) + 60); // Random values between 60-100%
      
      setComplianceHistory({
        labels,
        withHelmet
      });
      return;
    }
    
    // In a real application, you would filter data based on time frame
    // and calculate actual compliance rates for each time period
    
    // For now, let's simulate updating with semi-realistic data
    const labels = generateTimeLabels();
    
    // Calculate base compliance from real data
    const helmetsDetected = Object.values(helmetData).filter(val => val === true).length;
    const total = Object.keys(helmetData).length;
    const baseCompliance = total > 0 ? Math.round((helmetsDetected / total) * 100) : 75;
    
    // Create semi-random compliance data that trends around the base compliance
    const withHelmet = labels.map(() => {
      const variance = Math.floor(Math.random() * 20) - 10; // -10 to +10
      return Math.max(50, Math.min(100, baseCompliance + variance));
    });
    
    setComplianceHistory({
      labels,
      withHelmet
    });
  }, [helmetData, timeFrame]);
  
  // Update chart data when compliance history changes
  useEffect(() => {
    setChartData({
      labels: complianceHistory.labels,
      datasets: [
        {
          label: 'Helmet Compliance',
          data: complianceHistory.withHelmet,
          borderColor: 'rgba(46, 204, 113, 1)',  // Updated green color
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.5)');
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,  // Smoother curve
          pointRadius: (context) => {
            // Show points based on time frame
            const data = context.dataset.data;
            const pointIndex = context.dataIndex;
            const isFirst = pointIndex === 0;
            const isLast = pointIndex === data.length - 1;
            const isMax = Math.max(...data) === data[pointIndex];
            const isMin = Math.min(...data) === data[pointIndex];
            
            // For longer time frames, show fewer points
            if (timeFrame === 'full' || timeFrame === 'monthly') {
              // Show only first, last, min, max, and every 4th point
              return (isFirst || isLast || isMax || isMin || pointIndex % 4 === 0) ? 4 : 0;
            } else if (timeFrame === 'weekly') {
              // Show all points for weekly view
              return 3;
            } else if (timeFrame === 'daily') {
              // Show every 6th point for daily
              return (isFirst || isLast || isMax || isMin || pointIndex % 6 === 0) ? 3 : 0;
            } else {
              // Show only important points for hourly
              return (isFirst || isLast || isMax || isMin) ? 4 : 0;
            }
          },
          pointBackgroundColor: 'rgba(46, 204, 113, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgba(46, 204, 113, 1)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 3,  // Thicker line
          borderDash: [],  // Solid line
          borderCapStyle: 'round',
          borderJoinStyle: 'round'
        }
      ]
    });
  }, [complianceHistory, timeFrame]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 600,
        easing: 'easeOutQuad',
        from: 0.2,
        to: 0.4,
        loop: false
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
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
            return `Compliance: ${context.raw}%`;
          },
          title: function(context) {
            return context[0].label;
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
          color: '#666',
          maxRotation: timeFrame === 'monthly' || timeFrame === 'full' ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: timeFrame === 'hourly' ? 6 : (timeFrame === 'daily' ? 8 : 12)
        },
        title: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        suggestedMax: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          font: {
            family: 'Roboto',
            size: 11
          },
          color: '#666',
          padding: 8,
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: false
        }
      }
    }
  };
  
  // Check if there's any real data
  const hasData = Object.keys(helmetData).length > 0;
  
  // Show placeholder if no data is available
  if (!hasData) {
    return (
      <div className="helmet-compliance-chart compact d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
        <div className="text-center text-muted">
          <i className="fas fa-helmet-safety fa-3x mb-3"></i>
          <p>No helmet compliance data available. Upload data to see compliance trends.</p>
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
    <div className="helmet-compliance-chart compact">
      <div className="stats-header-row">
        <div className="stat-header-box">
          <div className="stat-header-label">CURRENT COMPLIANCE</div>
          <div className="stat-header-value helmet-compliance">
            {complianceHistory.withHelmet[complianceHistory.withHelmet.length - 1]}<span className="stat-unit">%</span>
          </div>
        </div>
        <div className="stat-header-box">
          <div className="stat-header-label">AVERAGE COMPLIANCE</div>
          <div className="stat-header-value helmet-avg">
            {Math.round(complianceHistory.withHelmet.reduce((a, b) => a + b, 0) / complianceHistory.withHelmet.length)}<span className="stat-unit">%</span>
          </div>
        </div>
        <div className="stat-header-box">
          <div className="stat-header-label">TREND</div>
          <div className="stat-header-value helmet-trend">
            {complianceHistory.withHelmet[complianceHistory.withHelmet.length - 1] > 
             complianceHistory.withHelmet[0] ? 
             <><i className="fas fa-arrow-up"></i> Up</> : 
             <><i className="fas fa-arrow-down"></i> Down</>}
          </div>
        </div>
      </div>
      
      <div className="info-row">
        <div className="info-box">
          <span className="info-label">VEHICLES</span>
          <span className="info-value">{Object.keys(helmetData).length}</span>
        </div>
        <div className="info-box">
          <span className="info-label">WITH HELMET</span>
          <span className="info-value">{Object.values(helmetData).filter(val => val === true).length}</span>
        </div>
        <div className="time-frame-info">
          <div className="time-frame-label">{getTimeFrameLabel()}</div>
        </div>
      </div>
      
      <div className="helmet-chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HelmetComplianceChart; 