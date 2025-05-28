# 🚦 Smart Traffic Control & Surveillance System

An <u>**AI**-powered</u> real-time multitasking system using advanced **machine learning** and **computer vision** to optimize urban traffic flow and enhance road safety. Using **Raspberry Pi** and camera modules for edge computing, it detects and classifies vehicles (**bike, car, bus, truck**), monitors **helmet usage**, **measures speed**, **number plates recognition** using (**OCR & Google Cloud Vision API**), and detect **emergency vehicles** like ambulances and fire brigades. The system dynamically adjusts traffic signals based on real-time traffic density and **prioritizes emergency vehicles** by instantly granting them green signals. All surveillance data including vehicle images, license plates, speed, location, and violations like red light jumping is securely uploaded to **cloud storage** and **web platform** using **RESTful APIs**. The platform provides **live analytics, vehicle info. search by license number, violation logs, Live map, and an automatic challan generation system**. Designed for government use, it ensures real-time updates, advanced 3 layer **authentication**, with security & privacy.

---

## 🧠 Problem Statement

➔ **Real world traffic problem:** Due to exponential growth of vehicles, traffic increasing day by day and  Conventional traffic signal systems rely on fixed timers or rudimentary sensors, leading to inefficiencies such as prolonged congestion, fuel waste, and increased emissions.

➔ **Raising Traffic Violations:** Helmet-less riding, signal jumping, and triple riding are rampant in many cities. Manual enforcement is ineffective and resource-intensive. Our system automatically detects violations using machine learning (YOLO model), improving enforcement efficiency.

➔ **Emergency Response Delays:** Congestion and poor traffic flow slow down emergency vehicles. By monitoring real-time traffic, the system can be scaled to prioritize emergency vehicle movement and dynamically manage signals.

➔ **Lack of Centralized Data:** Current systems don’t store violation data for easy access or reporting. Our solution uploads detected violations to the cloud, enabling officials to track offenders via license plate recognition and access reports through a web interface.

---

## ✅ Approach & Solution

We propose an **intelligent traffic control and surveillance system** using:
- **Edge computing** on Raspberry Pi with live camera feeds  
- **Custom YOLO11 ML model** for vehicle detection and classification, **Helmet, Speed, ANPR, Red light violation, Emergency vehicle detection**  
- **Automatic signal control based on traffic density and prioritizes emergency vehicles**  
- **Cloud storage** of surveillance data (images, license plates, logs) 
- **Web-based dashboard** for real-time analytics, live map and enforcement  

All data is processed in real-time, securely stored on Google Cloud, and made accessible to authorities through an advanced, role-based authentication system.

---

## ✨ Features

-  **Dynamic traffic signal control** based on real-time vehicle density  
-  **Automatic emergency vehicle prioritization**  
-  **Vehicle detection with classification (bike, car, bus, truck, etc.)**  
-  **Helmet detection**  
-  **Red light violation detection**  
-  **Speed detection & automatic number plate recognition (ANPR)**  
-  **Real-time data sync via RESTful APIs to cloud and web dashboard**  
-  **Searchable logs by license number, location, date, etc.**  
-  **Live maps, heatmaps, analytics graphs for traffic & violations**  
-  **Automatic challan generation with violation proof**  
-  **Advanced 3-level authentication for government users**  

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

### 1.  Automated Traffic Signal Control
- Dynamically adjusts signal timings based on real-time traffic density.
- Prioritizes lanes with high congestion and emergency vehicles (ambulances/fire brigades).
- Sets countdown timers adaptively for each lane to optimize traffic flow.

### 2.  Real-Time Traffic Surveillance
- Continuous 24/7 monitoring using Raspberry Pi and cameras.
- On-device edge processing for faster detection and reduced latency.
- Enables authorities to remotely observe and manage traffic behavior.

### 3.  Intelligent Traffic Law Enforcement
- Detects helmet-less riding, red-light jumping, and overspeeding.
- Uses YOLOv11, OpenCV, and EasyOCR for real-time violation tracking.
- Automatic challan generation with timestamped visual proof.

### 4.  Emergency Vehicle Management
- Identifies ambulances and fire brigades in real time.
- Automatically switches signals to green in their path for rapid clearance.
- Helps improve emergency response time and save lives.

### 5.  Cloud-Based Centralized Data Management
- Real-time upload of detected violations (images, license plates, speed, etc.) to Google Cloud.
- Provides a secure, scalable, and redundant data backup system.
- Enables centralized access for RTO and law enforcement departments.

### 6.  Government Web Portal for Analytics
- Real-time dashboard with violation logs and data filters (by state, city, region).
- License plate search with complete vehicle history and offenses.
- Enables efficient, data-driven decision making for enforcement agencies.

### 7.  Real-Time Traffic Analytics & Heat Mapping
- Live map with traffic signal status, countdown timers, and congestion zones.
- Heatmaps showing density trends across regions and time intervals.
- Assists in congestion prediction and traffic planning.

### 8.  Automatic Challan System
- Generates challans automatically for violations with proof (image, location, time).
- Reduces manual enforcement efforts and improves accuracy.
- Sends notifications to registered vehicle owners.

### 9.  Secure Role-Based Access Control
- Public users can access live maps and traffic updates.
- Government officials have full control with multi-step secure authentication.

### 10.  Urban Planning & Smart City Integration
- Uses historical traffic data to identify problem zones.
- Helps design better road layouts, signal placements, and traffic rules.
- Seamlessly integrates with smart city infrastructure.

### 11.  Legal Evidence for Dispute Resolution
- Surveillance data (images, timestamps) can be used in legal claims or traffic disputes.
- Increases transparency and accountability in traffic enforcement.

### 12.  Research & Academic Use
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
