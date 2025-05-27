import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const DashboardStats = ({ totalVehicles, averageSpeed, helmetCompliance, vehicleTypes }) => {
  return (
    <Row>
      <Col md={3}>
        <Card className="stat-card text-center">
          <Card.Body>
            <h2 className="stat-value">{totalVehicles}</h2>
            <h3 className="stat-title">Total Vehicles</h3>
            <p className="stat-subtitle">Detected in the system</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={3}>
        <Card className="stat-card text-center">
          <Card.Body>
            <h2 className="stat-value">{averageSpeed}</h2>
            <h3 className="stat-title">Average Speed</h3>
            <p className="stat-subtitle">Km/hr</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={3}>
        <Card className="stat-card text-center">
          <Card.Body>
            <h2 className="stat-value">{helmetCompliance}</h2>
            <h3 className="stat-title">Helmet Compliance</h3>
            <p className="stat-subtitle">Of two-wheelers with helmets</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={3}>
        <Card className="stat-card text-center">
          <Card.Body>
            <h2 className="stat-value">{vehicleTypes}</h2>
            <h3 className="stat-title">Vehicle Types</h3>
            <p className="stat-subtitle">Different types detected</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardStats; 