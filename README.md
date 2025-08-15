# 🚦 Smart & Climate Resilient Agriculture </h2>

---

## 🧠 Problem Statement

---

## ✅ Approach & Solution
    
---

## ⚡ Features

---

## 🧰 Tech Stack

| Layer         | Tools/Technologies Used |
|---------------|-------------------------|
| **Frontend**  | HTML, CSS, React, Next.js |
| **Backend**   | Node.js, Express.js, MongoDB, REST APIs, socket.io, OAuth 2.O, reCAPTCHA v2 |
| **AI/ML**     | Custom YOLOv11, OpenCV, AI Agent |
| **Cloud**     | Google earth engine, Maps API, BigQuery, Vertex AI agent builder, cloud function, cloud scheduler. |
| **Hardware**  | Arduino (Mega & UNO), IoT Sensors, I2C display, Solar panel, etc. |

---
## System Architecture
![Architecture](screenshots/architecture.png) 

---
## 🌍 Applications

---

## 📁 Directory Structure

```text
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
