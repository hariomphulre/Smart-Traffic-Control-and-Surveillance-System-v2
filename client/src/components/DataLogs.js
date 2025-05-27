import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { FaCctvSecurity, FaEye, FaVideo } from 'react-icons/fa';

const DataLogs = ({ data }) => {
  const [logs, setLogs] = useState([]);
  const [timeFrame, setTimeFrame] = useState('hourly');

  useEffect(() => {
    if (data) {
      setLogs(data);
    } else {
      // Generate mock data if none provided
      const mockData = Array(20).fill().map((_, i) => ({
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).getTime(),
        vehicleId: `VEH-${1000 + i}`,
        type: ['Car', 'Motorcycle', 'Truck', 'Bus'][Math.floor(Math.random() * 4)],
        speed: Math.floor(Math.random() * 120) + 20,
        helmet: Math.random() > 0.3,
        licensePlate: `ABC-${1000 + i}`,
        region: ['North', 'South', 'East', 'West', 'Central'][Math.floor(Math.random() * 5)],
        cameraId: `CAM-${Math.floor(Math.random() * 10) + 1}`,
        status: ['Recorded', 'Alerted', 'Flagged', 'Processed'][Math.floor(Math.random() * 4)]
      }));
      setLogs(mockData);
    }
  }, [data]);

  // Calculate metrics
  const totalDetections = logs.length;
  const incidents = logs.filter(log => log.speed > 80 || (log.type === 'Motorcycle' && !log.helmet)).length;
  const incidentRate = totalDetections > 0 ? Math.round((incidents / totalDetections) * 100) : 0;
  
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
    <div className="data-logs-chart compact">
      <div className="stats-header-row">
        <div className="stat-header-box">
          <div className="stat-header-label">TOTAL DETECTIONS</div>
          <div className="stat-header-value">{totalDetections}</div>
        </div>
        <div className="stat-header-box">
          <div className="stat-header-label">INCIDENTS</div>
          <div className="stat-header-value violations">{incidents}</div>
        </div>
        <div className="stat-header-box">
          <div className="stat-header-label">INCIDENT RATE</div>
          <div className="stat-header-value violation-rate">{incidentRate}<span className="stat-unit">%</span></div>
        </div>
      </div>
      
      <div className="info-row">
        <div className="info-box">
          <span className="info-label">CAMERAS</span>
          <span className="info-value">{new Set(logs.map(log => log.cameraId)).size}</span>
        </div>
        <div className="info-box">
          <span className="info-label">FLAGGED</span>
          <span className="info-value">{logs.filter(log => log.speed > 100 || (log.type === 'Motorcycle' && !log.helmet)).length}</span>
        </div>
        <div className="time-frame-info">
          <div className="time-frame-label">{getTimeFrameLabel()}</div>
        </div>
      </div>
      
      <div className="data-logs-container">
        <Table hover size="sm" className="mb-0">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Camera ID</th>
              <th>Vehicle ID</th>
              <th>Type</th>
              <th>Speed</th>
              <th>Helmet</th>
              <th>License Plate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.cameraId || `CAM-${Math.floor(Math.random() * 10) + 1}`}</td>
                <td>{log.vehicleId}</td>
                <td>{log.type}</td>
                <td className={log.speed > 80 ? 'text-danger fw-bold' : ''}>
                  {log.speed}<span className="stat-unit">km/h</span>
                </td>
                <td>
                  <span className={`badge ${log.helmet ? 'bg-success' : 'bg-danger'}`}>
                    {log.helmet ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{log.licensePlate}</td>
                <td>
                  <span className={`badge ${
                    log.status === 'Alerted' || log.status === 'Flagged' 
                      ? 'bg-warning text-dark' 
                      : (log.status === 'Processed' ? 'bg-success' : 'bg-info')
                  }`}>
                    {log.status || 'Recorded'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default DataLogs; 