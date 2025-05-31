import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from google.cloud import vision
import io
import json

# client = vision.ImageAnnotatorClient.from_service_account_file('service-account-key')

WATCH_FOLDER = 'local_data/all_license_plate_img'

############### json file to store license plate with track_id #############
FILE_PATH = "local_data/new_license_data.json"
# Load existing dictionary (if available)
def load_dict():
    try:
        with open(FILE_PATH, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}  # Default to empty dict if file doesn't exist or is corrupted

# Save dictionary to file
def save_dict(data):
    with open(FILE_PATH, "w") as file:
        json.dump(data, file, indent=4)

license_dict=load_dict()
##################################################

import os

def wait_for_file_complete(file_path, timeout=5):
    """Wait until file size stabilizes (means writing is done)"""
    start_time = time.time()
    last_size = -1
    while time.time() - start_time < timeout:
        current_size = os.path.getsize(file_path)
        if current_size == last_size:
            return True
        last_size = current_size
        time.sleep(0.2)
    return False

def process_image(file_path, track_id):
    try:
        if not wait_for_file_complete(file_path):
            print(f"File {file_path} is not stable. Skipping.")
            return
        with io.open(file_path, 'rb') as image_file:
            content = image_file.read()
        if not content:
            print(f"Empty image: {file_path}")
            return

        image = vision.Image(content=content)
        response = client.text_detection(image=image)
        texts = response.text_annotations

        if texts:
            license_no = texts[0].description.strip()
            license_dict[track_id] = license_no
            save_dict(license_dict)
            print(f"Detected License No. [{license_no}]")
        else:
            print(f"No text detected in image: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")



class detected_image_handler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return
        file_path = event.src_path
        if file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
            track_id = os.path.splitext(os.path.basename(file_path))[0]
            process_image(file_path, track_id)

    def on_created(self, event):
        if event.is_directory:
            return
        file_path = event.src_path
        if file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
            track_id = os.path.splitext(os.path.basename(file_path))[0]
            process_image(file_path, track_id)

def start_monitoring():

    
    event_handler = detected_image_handler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_FOLDER, recursive=True)
    observer.start()
    print(f"Watching: {WATCH_FOLDER}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    start_monitoring()
