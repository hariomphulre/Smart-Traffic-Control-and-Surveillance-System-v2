# 🚦 Smart Traffic Control & Surveillance System

A real-time, AI-powered traffic control and surveillance platform integrating Computer Vision, Edge Computing, and Cloud Technology to solve modern urban traffic challenges.

---

## 🧠 Problem Statement

Urban areas today suffer from:
- Severe traffic congestion
- Frequent traffic violations (helmet-less riding, red light jumping, overspeeding)
- Delayed emergency response
- Ineffective and outdated traffic control systems

Traditional traffic systems use static timers and lack the intelligence to adapt in real-time. Manual enforcement is inefficient and resource-intensive, while the absence of centralized violation data makes tracking offenders difficult.

---

## ✅ Approach & Solution

We propose an **intelligent traffic control and surveillance system** using:
- **Edge computing** on Raspberry Pi with live camera feeds
- **YOLO11 ML model** for vehicle detection and classification
- **Helmet, speed, ANPR, and red light violation detection**
- **Emergency vehicle detection and automatic signal prioritization**
- **Cloud storage** of surveillance data (images, license plates, logs)
- **Web-based dashboard** for real-time analytics and enforcement

All data is processed in real-time, securely stored on Google Cloud, and made accessible to authorities through an advanced, role-based authentication system.

---

## ✨ Features

- 🚦 **Dynamic traffic signal control** based on real-time vehicle density  
- 🚑 **Automatic emergency vehicle prioritization**  
- 📸 **Vehicle detection with classification (bike, car, truck, etc.)**  
- 🪖 **Helmet detection**  
- 🛑 **Red light violation detection**  
- 🚓 **Speed detection & automatic number plate recognition (ANPR)**  
- 📡 **Real-time data sync via RESTful APIs to cloud and web dashboard**  
- 🔍 **Searchable logs by license number, location, date, etc.**  
- 📊 **Live maps, heatmaps, analytics graphs for traffic & violations**  
- 🧾 **Automatic challan generation with violation proof**  
- 🔐 **Advanced 3-level authentication for government users**  

---

## 🧰 Tech Stack

| Layer         | Tools/Technologies Used |
|---------------|-------------------------|
| **Frontend**  | React, Next.js, Angular, Google Maps API |
| **Backend**   | Node.js, Express.js, RESTful APIs |
| **AI/ML**     | Custom YOLOv11, OpenCV, EasyOCR, Google Vision API |
| **Hardware**  | Raspberry Pi, Camera Modules |
| **Cloud**     | Google Cloud Platform (GCP), Google Cloud Storage, Compute Engine |
| **Dev Tools** | Docker, Google Colab, SQL |

---
## System Architecture
![Architecture](screenshots/architecture.png) 
## 🖼️ Screenshots

| Dashboard | Live Map |
|----------|----------|
| ![Dashboard](screenshots/dashboard.png) | ![Map](screenshots/map.png) |

| Violation Detection | License Plate Logs |
|---------------------|--------------------|
| ![Detection](screenshots/violation_detection.png) | ![Logs](screenshots/logs.png) |

---
## 🌍 Applications

### 1. 🚦 Automated Traffic Signal Control
- Dynamically adjusts signal timings based on real-time traffic density.
- Prioritizes lanes with high congestion and emergency vehicles (ambulances/fire brigades).
- Sets countdown timers adaptively for each lane to optimize traffic flow.

### 2. 🎥 Real-Time Traffic Surveillance
- Continuous 24/7 monitoring using Raspberry Pi and cameras.
- On-device edge processing for faster detection and reduced latency.
- Enables authorities to remotely observe and manage traffic behavior.

### 3. 🚔 Intelligent Traffic Law Enforcement
- Detects helmet-less riding, red-light jumping, and overspeeding.
- Uses YOLOv11, OpenCV, and EasyOCR for real-time violation tracking.
- Automatic challan generation with timestamped visual proof.

### 4. 🚑 Emergency Vehicle Management
- Identifies ambulances and fire brigades in real time.
- Automatically switches signals to green in their path for rapid clearance.
- Helps improve emergency response time and save lives.

### 5. ☁️ Cloud-Based Centralized Data Management
- Real-time upload of detected violations (images, license plates, speed, etc.) to Google Cloud.
- Provides a secure, scalable, and redundant data backup system.
- Enables centralized access for RTO and law enforcement departments.

### 6. 🧭 Government Web Portal for Analytics
- Real-time dashboard with violation logs and data filters (by state, city, region).
- License plate search with complete vehicle history and offenses.
- Enables efficient, data-driven decision making for enforcement agencies.

### 7. 🔥 Real-Time Traffic Analytics & Heat Mapping
- Live map with traffic signal status, countdown timers, and congestion zones.
- Heatmaps showing density trends across regions and time intervals.
- Assists in congestion prediction and traffic planning.

### 8. 🧾 Automatic Challan System
- Generates challans automatically for violations with proof (image, location, time).
- Reduces manual enforcement efforts and improves accuracy.
- Sends notifications to registered vehicle owners.

### 9. 🔐 Secure Role-Based Access Control
- Public users can access live maps and traffic updates.
- Government officials have full control with multi-step secure authentication.

### 10. 🏙️ Urban Planning & Smart City Integration
- Uses historical traffic data to identify problem zones.
- Helps design better road layouts, signal placements, and traffic rules.
- Seamlessly integrates with smart city infrastructure.

### 11. ⚖️ Legal Evidence for Dispute Resolution
- Surveillance data (images, timestamps) can be used in legal claims or traffic disputes.
- Increases transparency and accountability in traffic enforcement.

### 12. 🎓 Research & Academic Use
- Datasets generated from real-world scenarios can be used to train AI models.
- Enables academic research in smart transportation, urban planning, and computer vision.


## 🚀 Run Instructions

### ⚙️ Prerequisites
- Node.js
- Python 3.x
- Raspberry Pi (for hardware-side setup)
- Google Cloud credentials & API access (Vision API, GCP bucket)

### 🖥️ Backend Setup

```bash
cd backend
npm install
npm start
