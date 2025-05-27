import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaCamera, FaDatabase, FaCheck, FaSpinner } from 'react-icons/fa';

const UploadForm = ({ onDataUpload, onImageUpload }) => {
  // State for form inputs
  const [vehicleId, setVehicleId] = useState('');
  const [speedValue, setSpeedValue] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [helmetDetected, setHelmetDetected] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [dataType, setDataType] = useState('speed');
  const [region, setRegion] = useState('');
  
  // State for image uploads
  const [vehicleImages, setVehicleImages] = useState([]);
  const [licensePlateImages, setLicensePlateImages] = useState([]);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Vehicle image dropzone
  const vehicleDropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    onDrop: acceptedFiles => {
      setVehicleImages(acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      })));
    }
  });
  
  // License plate image dropzone
  const licensePlateDropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    onDrop: acceptedFiles => {
      setLicensePlateImages(acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      })));
    }
  });
  
  // Combined form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Validation
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // Form data based on data type
      let data = { vehicleType, region };
      
      switch(dataType) {
        case 'speed':
          if (!speedValue) {
            throw new Error('Speed value is required');
          }
          data = { ...data, [vehicleId]: parseInt(speedValue, 10) };
          break;
          
        case 'license':
          if (!licensePlate) {
            throw new Error('License plate number is required');
          }
          data = { ...data, [vehicleId]: licensePlate };
          break;
          
        case 'helmet':
          if (helmetDetected === '') {
            throw new Error('Helmet detection status is required');
          }
          data = { ...data, [vehicleId]: helmetDetected === 'yes' };
          break;
          
        default:
          throw new Error('Invalid data type');
      }
      
      // Handle both uploads
      if (vehicleImages.length > 0 || licensePlateImages.length > 0) {
        await onImageUpload(vehicleImages, licensePlateImages);
      }
      
      await onDataUpload(dataType, data);
      
      // Success
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      // Reset form
      setVehicleId('');
      setSpeedValue('');
      setLicensePlate('');
      setHelmetDetected('');
      setVehicleImages([]);
      setLicensePlateImages([]);
      
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Clean up previews when unmounting
  useEffect(() => {
    return () => {
      vehicleImages.forEach(file => URL.revokeObjectURL(file.preview));
      licensePlateImages.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [vehicleImages, licensePlateImages]);
  
  return (
    <div className="combined-upload">
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex align-items-center">
          <FaUpload className="me-2" /> Upload Surveillance Data
        </Card.Header>
        <Card.Body>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {submitSuccess && <Alert variant="success">Upload completed successfully!</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <div className="stats-header-row mb-3">
              <div className="stat-header-box">
                <div className="stat-header-label">DATA TYPE</div>
                <div className="stat-header-value">
                  <Form.Select 
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value)}
                    className="form-select-sm border-0 fw-bold"
                  >
                    <option value="speed">Speed Data</option>
                    <option value="license">License Plate</option>
                    <option value="helmet">Helmet Detection</option>
                  </Form.Select>
                </div>
              </div>
              
              <div className="stat-header-box">
                <div className="stat-header-label">VEHICLE TYPE</div>
                <div className="stat-header-value">
                  <Form.Select 
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="form-select-sm border-0 fw-bold"
                  >
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="truck">Truck</option>
                    <option value="bus">Bus</option>
                  </Form.Select>
                </div>
              </div>
              
              <div className="stat-header-box">
                <div className="stat-header-label">REGION</div>
                <div className="stat-header-value">
                  <Form.Select 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="form-select-sm border-0 fw-bold"
                  >
                    <option value="">Select Region</option>
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                    <option value="central">Central</option>
                  </Form.Select>
                </div>
              </div>
            </div>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter vehicle ID (required)"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                  />
                </Form.Group>
                
                {dataType === 'speed' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Speed (km/h)</Form.Label>
                    <Form.Control 
                      type="number" 
                      placeholder="Enter speed"
                      value={speedValue}
                      onChange={(e) => setSpeedValue(e.target.value)}
                      required
                    />
                  </Form.Group>
                )}
                
                {dataType === 'license' && (
                  <Form.Group className="mb-3">
                    <Form.Label>License Plate Number</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter license plate number"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      required
                    />
                  </Form.Group>
                )}
                
                {dataType === 'helmet' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Helmet Detected</Form.Label>
                    <Form.Select 
                      value={helmetDetected}
                      onChange={(e) => setHelmetDetected(e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Form.Select>
                  </Form.Group>
                )}
              </Col>
              
              <Col md={6}>
                <div className="upload-columns">
                  <div className="image-upload-section">
                    <Form.Label className="d-flex align-items-center">
                      <FaCamera className="me-2" /> Vehicle Image
                    </Form.Label>
                    <div 
                      {...vehicleDropzone.getRootProps()} 
                      className="upload-area"
                    >
                      <input {...vehicleDropzone.getInputProps()} />
                      {vehicleImages.length === 0 ? (
                        <p>Drop vehicle image here</p>
                      ) : (
                        <p>{vehicleImages.length} image selected</p>
                      )}
                    </div>
                    
                    {vehicleImages.length > 0 && (
                      <div className="image-preview">
                        <img 
                          src={vehicleImages[0].preview} 
                          alt="Vehicle preview"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="image-upload-section">
                    <Form.Label className="d-flex align-items-center">
                      <FaCamera className="me-2" /> License Plate Image
                    </Form.Label>
                    <div 
                      {...licensePlateDropzone.getRootProps()} 
                      className="upload-area"
                    >
                      <input {...licensePlateDropzone.getInputProps()} />
                      {licensePlateImages.length === 0 ? (
                        <p>Drop license plate image here</p>
                      ) : (
                        <p>{licensePlateImages.length} image selected</p>
                      )}
                    </div>
                    
                    {licensePlateImages.length > 0 && (
                      <div className="image-preview">
                        <img 
                          src={licensePlateImages[0].preview} 
                          alt="License plate preview"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-3">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
                className="upload-button"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="fa-spin me-2" /> Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="me-2" /> Upload All Data
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UploadForm; 