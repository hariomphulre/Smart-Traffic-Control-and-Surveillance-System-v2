import React, { useState } from 'react';
import { Card, Table, Form, InputGroup } from 'react-bootstrap';

const VehicleDataDisplay = ({ speedData, licenseData, helmetData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create a combined dataset for display
  const createCombinedData = () => {
    const combinedData = {};
    
    // Add vehicle IDs from all data sources
    const allVehicleIds = [...new Set([
      ...Object.keys(speedData),
      ...Object.keys(licenseData),
      ...Object.keys(helmetData)
    ])];
    
    // Create combined records
    allVehicleIds.forEach(id => {
      combinedData[id] = {
        id,
        speed: speedData[id] || 'N/A',
        licensePlate: licenseData[id] || 'N/A',
        helmetDetected: helmetData[id] === true ? 'Yes' : 
                        helmetData[id] === false ? 'No' : 'N/A',
        timestamp: new Date().toLocaleString(), // Dummy timestamp
        location: 'Camera 1' // Dummy location
      };
    });
    
    return Object.values(combinedData);
  };
  
  const combinedData = createCombinedData();
  
  // Filter data based on search term
  const filteredData = combinedData.filter(vehicle => {
    return (
      vehicle.id.toString().includes(searchTerm) ||
      vehicle.licensePlate.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Traffic Surveillance Records</h5>
          <InputGroup className="w-50">
            <InputGroup.Text>
              <i className="fa fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by ID or license plate"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
      </Card.Header>
      <Card.Body>
        {filteredData.length === 0 ? (
          <p className="text-center">No vehicle data available</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr className="bg-light">
                  <th>Vehicle ID</th>
                  <th>Timestamp</th>
                  <th>License Plate</th>
                  <th>Speed (km/h)</th>
                  <th>Helmet Detected</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>
                    <td>{vehicle.timestamp}</td>
                    <td>{vehicle.licensePlate}</td>
                    <td>
                      <span 
                        className={vehicle.speed > 40 ? 'text-danger fw-bold' : ''}
                      >
                        {vehicle.speed}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={
                          vehicle.helmetDetected === 'Yes' 
                            ? 'text-success'
                            : vehicle.helmetDetected === 'No'
                            ? 'text-danger'
                            : ''
                        }
                      >
                        {vehicle.helmetDetected}
                      </span>
                    </td>
                    <td>{vehicle.location}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
      <Card.Footer className="text-muted">
        <small>Showing {filteredData.length} of {combinedData.length} records</small>
      </Card.Footer>
    </Card>
  );
};

export default VehicleDataDisplay; 