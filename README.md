# 🚦 Smart Traffic Control & Surveillance System </h2>

An **AI**-powered real-time multitasking system using advanced **custom trained** machine learning model (**YOLOv11**) and **OpenCV**. **Raspberry Pi** and camera modules for edge computing, It detects and classifies vehicles such as (**bike, car, bus, truck**), monitors **helmet usage, measures speed**, automatic number plate recognition (**ANPR via OCR & Google Cloud Vision API**), detects **emergency vehicles like ambulance and fire brigade**. The system dynamically adjusts traffic signals based on real-time traffic density and **prioritize emergency vehicles** by green signal and speakers announcement. All capture data including vehicle images, license plate, speed, location, helmet status and red signal break. are securely uploaded on **cloud** and **web platform** on real-time using **web socket** and **Rest API**, The web platfrom is specially designed for **government** use. It provides real-time analytics, detailed vehicle logs, automatic **challan generation** system with proof like detected vehicle image, speed, helmet status, license plate.




<!-- 🔗 Quick Links (Top-left) -->
<h4 align="left">🔗 Quick Links</h4>
<div align="center">

  [![Web Platform](https://img.shields.io/badge/Web%20Platform-%230F02FA?style=for-the-badge&logo=google-chrome&logoColor=white)](https://smart-traffic-management-coral.vercel.app/)
  [![Demo Video](https://img.shields.io/badge/Demo%20Video-%230F02FA?style=for-the-badge&logo=google-drive&logoColor=white)](https://drive.google.com/drive/folders/1DZk65OEfl7p-JjCCmI10vz38FJECrCuI)
  [![🤖 Prototype](https://img.shields.io/badge/🤖_Prototype-%230F02FA?style=for-the-badge)](https://drive.google.com/drive/folders/1DZk65OEfl7p-JjCCmI10vz38FJECrCuI?usp=sharing)

</div>  


---

## 🧠 Problem Statement

  ➔ **Real world traffic problem:** Due to exponential growth of vehicles, traffic increasing day by day and Conventional traffic signal systems rely on fixed timers, leading to traffic congestion, fuel waste, and increased emissions.
  
  ➔ **Raising Traffic Violations:** Helmet-less riding, red signal jumping, and triple riding are violate traffic rules & increases accidents. Manual enforcement is ineffective and require ground team.
  
  ➔ **Emergency Response Delays:** Congestion and poor traffic flow slow down emergency vehicles.


---

## ✅ Approach & Solution

  ➢ Deploy Raspberry Pi with camera modules at traffic signals to capture real-time video using edge computing.
  
  ➢ Use custom-trained YOLOv11 model for vehicle detection and classification (bike, car, bus, truck), directly on edge devices.</br>
  - Helmet, Speed, Emergency vehicle, Red light violation detection.</br>
  - Automatic Number Plate Recognition (ANPR) with EasyOCR and Google Cloud Vision API.
  
  ➢ Develop an algorithm to control traffic signals dynamically by prioritizing high density traffic with dynamic countdown & Emergency vehicles by granting immediate green signals.
  
  ➢ Securely upload all surveillance data including vehicle images, license plates, speed, helmet status, and violations to cloud storage and a web platform in real-time via RESTful APIs.
  
  ➢ Build a web platform with features like: Real time Analytics, Detections logs with images, Automatic challan system, real time traffic on Live map, Authentication, etc.

---

## ⚡ Features

-  **Dynamic traffic signal & countdown control** based on real-time traffic density  
-  **Automatic emergency vehicle prioritization**  
-  **Vehicle detection with classification (bike, car, bus, truck, etc.)**  
-  **Helmet , speed, red light violation detection**
-  **Automatic number plate recognition (ANPR)**  
-  **Real-time data sync via RESTful APIs to cloud and web dashboard**
-  **Real-time analytics dashboard with graphs** 
-  **Searchable detection logs by license number, location, date, time, etc.**  
-  **Automatic challan generation with violation proof**  
-  **Advanced 3-level authentication for government users**  

---

 ## 🧰 Tech Stack

 | Layer         | Tools/Technologies Used |
 |---------------|-------------------------|
 | **Frontend**  | React, Next.js, Google Maps API |
 | **Backend**   | Node.js, Express.js, RESTful APIs, socket.io |
 | **AI/ML**     | Custom YOLOv11, OpenCV, EasyOCR, Google Cloud Vision API |
 | **Hardware**  | Raspberry Pi, Camera Modules, I2C LCD |
 | **Dev Tools** | Google Cloud Platform (GCP), Google Colab, MongoDB, OAuth 2.O |

 ---
 ## System Architecture
 ![Architecture](screenshots/architecture.png) 
 ## 🖼️ Screenshots

 | Dashboard |
 |----------|
 | ![Dashboard](screenshots/web_dashboard.png) ![Graphs](screenshots/dashboard_graph.png) | ![Map](screenshots/map.png) |

 | Detection Logs | Vehicle info |
 |--------------------|--------------|
 | ![Logs](screenshots/vehicle_data_logs.jpg) | ![vehicle_info](screenshots/vehicle_info.jpg)

 | Detection demo 1 | Detection Demo 2 |
 |---------------------|----------------------------|
 | ![Detection](screenshots/detection_demo1.png) | ![Detection](screenshots/detection_demo2.png) |

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

 ---

 ## 📁 Directory Structure

 ```text
 Smart-Traffic-Control-and-Surveillance-System-v3.0/
 ├── client/
 │   ├── public/
 │   │   ├── index.html
 │   │   └── manifest.json
 │   └── src/
 │       ├── App.js
 │       ├── components/
 │       │   ├── DashboardStats.js
 │       │   ├── DataLogs.js
 │       │   ├── Footer.js
 │       │   ├── Header.js
 │       │   ├── HelmetComplianceChart.js
 │       │   ├── ImageGallery.js
 │       │   ├── LicensePlateRegionChart.js
 │       │   ├── SpeedDistributionChart.js
 │       │   ├── SystemStatusBar.js
 │       │   ├── TrafficVolumeChart.js
 │       │   ├── UploadForm.js
 │       │   ├── VehicleDataDisplay.js
 │       │   └── VehicleTypeDistribution.js
 │       ├── index.css
 │       ├── index.js
 │       ├── reportWebVitals.js
 │       └── styles/
 │           ├── DarkMode.css
 │           ├── Dashboard.css
 │           ├── DashboardStats.css
 │           ├── Footer.css
 │           ├── Header.css
 │           ├── Navbar.css
 │           ├── SystemStatusBar.css
 │           ├── TrafficVolumeChart.css
 │           ├── VehicleDataDisplay.css
 │           └── VehicleTypeDistribution.css
 ├── server/
 │   ├── server.js
 │   └── vehicle_data_with_helmet/
 │       ├── all_license_plate_img/
 │       ├── all_vehicle_detected_img/
 │       ├── helmet_data.json
 │       ├── new_license_data.json
 │       ├── new_sort_license_plate_img/
 │       ├── speed_data.json
 │       └── vehicle_types.json
 ├── lcd/
 │   └── c1_watch_count2.py
 ├── traffic_signal_simulation/
 │   ├── simulation.py
 │   ├── simulation2.py
 │   ├── simulation3.py
 │   ├── traffic.json
 │   ├── traffic2.json
 │   ├── watch_signals.py
 │   ├── watch_signals2.py
 │   └── watch_signals3.py
 ├── custom_yolo11.pt
 ├── R1.py
 ├── R2.py
 ├── R3.py
 ├── R4.py
 ├── yolo_detect.py
 ├── detection_simulation.py
 ├── watchdog_simulation.py
 ├── watchdog_simulation2.py
 └── README.md
 ```

 ## 🚀 Run Instructions

 ### ⚙️ Prerequisites
 - Node.js & npm
 - Python 3.x
 - Raspberry Pi, I2C LCD (for hardware-side setup)
 - I2C LCD library (https://github.com/the-raspberry-pi-guy/lcd)
 - Google Cloud credentials & API access (Vision API, GCP bucket)
 - Google Cloud Service Account KEY
 - Ultralytics

 ### 1. Backend Setup

 ```bash
 cd server
 npm install
 npm start
 ```
 ### 2. Frontend Setup

 ```bash
 cd client
 npm install
 npm start
 ```
 ### 3. Raspberry Pi & I2C LCD Setup

 - Connect Raspberry Pi via SSH using IP address to RealVNC or VS code
 - Make sure you Enable I2C, SSH, VNC in ```sudo raspi-config```.
 - LED & I2C connections with Raspberry Pi using breadboard & jumpers wires, refer GPIO pins ```traffic_lights = [17, 27, 5, 6, 13, 19, 26, 18, 23, 24, 25, 9]  # R1,R2...Y4``` (/traffic_signal_simulation
 /watch_signals3.py Line 27)
 ```bash
 sudo apt update
 git clone https://github.com/hariomphulre/Smart-Traffic-Control-and-Surveillance-System-v2.git
 cd Smart-Traffic-Control-and-Surveillance-System-v2
 ```
 - install I2C library in current directory
 - move "watch_count_lcd.py" into "lcd" folder
 ```
 cd traffic_signal_simulation
 python3 -m venv traffic2
 source traffic2/bin/activate
 pip install watchdog
 pip install opencv-python
 pip install google.cloud.vision
 pip install ultralytics
 pip install lgpio
 ```
 ### 4. Run the System on Raspberry Pi 
 To run full system, it requires 8 terminals running simultaneously.</br>
 ⚠️ Warning! heating issue with Raspberry Pi, Plz use cooling fan.

 #Terminal 1:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 python watch_signals3.py
 ```
 #Terminal 2:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 cd ..
 cd lcd
 python watch_count_lcd.py
 ```
 #Terminal 3:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 cd ..
 python watchdog_simulation2.py
 ```
 #Terminal 4:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 python simulation3.py
 ```
 Note: Below Terminals must run via RealVNC

 #Terminal 5:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 cd ..
 python R1.py --model=custom_yolo11.pt --source=video4.mp4 --resolution=480x480
 ```
 #Terminal 6:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 cd ..
 python R2.py --model=custom_yolo11.pt --source=video2.mp4 --resolution=480x480
 ```
 #Terminal 7:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 cd ..
 python R3.py --model=custom_yolo11.pt --source=video3.mp4 --resolution=480x480
 ```
 #Terminal 8:
 ```
 cd Smart-Traffic-Control-and-Surveillance-System-v2/traffic_signal_simulation
 source traffic2/bin/activate
 cd ..
 python R4.py --model=custom_yolo11.pt --source=video9.mp4 --resolution=480x480
 ```
                   
