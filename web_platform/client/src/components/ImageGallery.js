import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ImageGallery = ({ images, type }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Handle image click to show in modal
  const handleImageClick = (image) => {
    setSelectedImage(image);
  };
  
  // Close modal
  const handleClose = () => {
    setSelectedImage(null);
  };
  
  // Extract ID from image path for display
  const extractId = (imagePath) => {
    const fileName = imagePath.split('/').pop();
    const match = fileName.match(/(?:car|license_plate)_(\d+)/);
    return match ? match[1] : 'Unknown';
  };
  
  return (
    <div>
      {images.length === 0 ? (
        <p className="text-center">No images available</p>
      ) : (
        <div className="image-gallery">
          {images.map((image, index) => (
            <div key={index} className="image-item" onClick={() => handleImageClick(image)}>
              <img src={image} alt={`${type} ${extractId(image)}`} />
              <p className="text-center mt-2 mb-0">
                {type === 'vehicle' ? 'Vehicle' : 'License Plate'} ID: {extractId(image)}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Image Modal */}
      <Modal show={!!selectedImage} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {type === 'vehicle' ? 'Vehicle' : 'License Plate'} ID: {selectedImage ? extractId(selectedImage) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt={`${type} ${extractId(selectedImage)}`} 
              style={{ maxWidth: '100%', maxHeight: '70vh' }} 
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ImageGallery; 