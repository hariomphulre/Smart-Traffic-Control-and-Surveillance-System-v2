import time
import sys
import lgpio
import json
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from google.cloud import vision

########## Load traffic2.json to access data ################
FILE_PATH = r"/home/pi/Desktop/Smart-Traffic-Control-and-Surveillance-System-v3.0/traffic_signal_simulation/traffic2.json"

def load_data():
    try:
        with open(FILE_PATH, "r") as file:
            data = json.load(file)
            print(f"Loaded traffic data: {data}")  # Debug print
            return data
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error: {e}")
        return {} 

############# Raspberry Pi #####################

H = lgpio.gpiochip_open(0)

traffic_lights = [17, 27, 5, 6, 13, 19, 26, 18, 23, 24, 25, 9]  # R1,R2...Y4

# Initialize GPIO pins
for light in traffic_lights:
    try:
        lgpio.gpio_claim_output(H, light)
        lgpio.gpio_write(H, light, 0)  # Start with all lights off
    except Exception as e:
        print(f"Error {light}: {e}")

############## Watch traffic2.json ####################

WATCH_FOLDER = "/home/pi/Desktop/Smart-Traffic-Control-and-Surveillance-System-v3.0/traffic_signal_simulation"

class detected_image_Handler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return
        
        file_path = event.src_path
        print(f"File modified: {file_path}")  # Debug print
        
        if file_path.lower().endswith('.json') and 'traffic2.json' in file_path:
            try:
                traffic = load_data()
                
                if not traffic:
                    return
                
                for light in traffic_lights:
                    lgpio.gpio_write(H, light, 0)
                
                
                X = "R"
                for i in range(12):
                    key = X + f"{((i % 4) + 1)}"
                    
                    if traffic.get(key, False):  # Safe dictionary access
                        lgpio.gpio_write(H, traffic_lights[i], 1)
                    else:
                        lgpio.gpio_write(H, traffic_lights[i], 0)
                    
                    if i == 3:
                        X = "G"
                    if i == 7:
                        X = "Y"
                
                print("TRAFFIC SIGNALS ARE UPDATED")
                
            except Exception as e:
                print(f"Error updating traffic signals: {e}")

def test_all_lights():
    print("Testing all signals...")
    for i, light in enumerate(traffic_lights):
        lgpio.gpio_write(H, light, 1)
        # print(f"Testing light {i} (GPIO {light})")
        # time.sleep(0.5)
        # lgpio.gpio_write(H, light, 0)
        # time.sleep(0.2)
    time.sleep(3)
    for i, light in enumerate(traffic_lights):
        lgpio.gpio_write(H, light, 0)

def start_monitoring():
    print("Start monitoring...")
    
    test_all_lights()
    
    traffic = load_data()
    if traffic:
        handler = detected_image_Handler()
        class MockEvent:
            def __init__(self):
                self.is_directory = False
                self.src_path = FILE_PATH
        handler.on_modified(MockEvent())
    
    event_handler = detected_image_Handler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_FOLDER, recursive=True)
    observer.start()
    print(f"Watching folder: {WATCH_FOLDER}")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    except Exception as e:
        observer.stop()
    finally:
        for light in traffic_lights:
            lgpio.gpio_write(H, light, 0)  # Turn off all lights
        lgpio.gpiochip_close(H)
        print("OFF All SIGNALS")
    
    observer.join()

if __name__ == "__main__":
    start_monitoring()