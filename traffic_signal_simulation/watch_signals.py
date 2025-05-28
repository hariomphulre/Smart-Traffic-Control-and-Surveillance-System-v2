import time
import sys
import lgpio
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
# from google.cloud import vision

########## Load traffic.json to access data ################
FILE_PATH ="/home/pi/Desktop/stcnss/Smart-Traffic-Control-and-Surveillance-System/demo/traffic.json"

# Load existing dictionary (if available)
def load_data():
    try:
        with open(FILE_PATH, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}  # Default to empty dict if file doesn't exist or is corrupted

############# Raspberry Pi #####################

H=lgpio.gpiochip_open(0)

traffic_lights=[17,27,5,6,13,19,26,18,23,24,25,9] # R1,R2...Y4
segments=[2,3,22,11,10,21,12]
numbers=[
    [0,0,0,0,0,0,1],
    [1,0,0,1,1,1,1], 
    [0,0,1,0,0,1,0],
    [0,0,0,0,1,1,0],  
    [1,0,0,1,1,0,0],  
    [0,1,0,0,1,0,0],  
    [0,1,0,0,0,0,0],   
    [0,0,0,1,1,1,1],  
    [0,0,0,0,0,0,0], 
    [0,0,0,0,1,0,0]   
]
digits=[16,20]

for light in traffic_lights:
    lgpio.gpio_claim_output(H,light)

lgpio.gpio_claim_output(H,digits[0])
lgpio.gpio_claim_output(H,digits[1])

for segment in segments:
    lgpio.gpio_claim_output(H,segment)

############## Watch traffic.json ####################

WATCH_FOLDER="/home/pi/Desktop/stcnss/Smart-Traffic-Control-and-Surveillance-System/demo"

def countdown(k,i):
    while True:
        ####################################################
        traffic=load_data()

        for light in traffic_lights:
            lgpio.gpio_write(H,light,0) # off all lights

        X="R"
        for w in range (12):
            if(traffic.get(X+f"{(((w)%4)+1)}")):
                lgpio.gpio_write(H,traffic_lights[w],1)
            if(w==3):
                X="G"
            if(w==7):
                X="Y"
        ###########################################################
        if i<=3 and k==0:
            lgpio.gpio_write(H,digits[0],0)
            lgpio.gpio_write(H,digits[1],0)
            time.sleep(0.3)
            lgpio.gpio_write(H,digits[0],1)
            lgpio.gpio_write(H,digits[1],1)

        for n in range (49): # countdown speed  
            for j in range(7):
                lgpio.gpio_write(H,segments[j], numbers[i][j])
            lgpio.gpio_write(H,digits[0], 1)
            lgpio.gpio_write(H,digits[1], 0)
            time.sleep(0.01)

            for j in range(7):
                lgpio.gpio_write(H,segments[j], numbers[k][j])
            lgpio.gpio_write(H,digits[0], 0)
            lgpio.gpio_write(H,digits[1], 1)
            time.sleep(0.01)


        i-=1
        if k==0 and i==-1:
            lgpio.gpio_write(H,digits[0],0)
            lgpio.gpio_write(H,digits[1],0)
            break
        if i==-1:
            i = 9
            k-=1
            if k==-1:
                lgpio.gpio_write(H,digits[0],0)
                lgpio.gpio_write(H,digits[1],0)

###################################################################

class detected_image_Handler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return
        
        file_path = event.src_path
        
        if file_path.lower().endswith(('.json')):
            traffic=load_data()
            for light in traffic_lights:
                lgpio.gpio_write(H,light,0) # off all lights

            X="R"
            for i in range (12):
                if(traffic.get(X+f"{(((i)%4)+1)}")):
                    lgpio.gpio_write(H,traffic_lights[i],1)
                if(i==3):
                    X="G"
                if(i==7):
                    X="Y"

            print(f"TRAFFIC SIGNALS ARE UPDATED")

        #################################################################
            traffic=load_data()
            
            ##########################################
            for light in traffic_lights:
                lgpio.gpio_write(H,light,0) # off all lights

            X="R"
            for i in range (12):
                if(traffic.get(X+f"{(((i)%4)+1)}")):
                    lgpio.gpio_write(H,traffic_lights[i],1)
                if(i==3):
                    X="G"
                if(i==7):
                    X="Y"
            #########################################

            num=traffic['C']
            lgpio.gpio_write(H,digits[0],1)
            lgpio.gpio_write(H,digits[1],1)
            if(traffic['C']>9):

                digit1=int(traffic['C']%10)
                num=int(num/10)
                # for i in range(7):
                #     lgpio.gpio_write(H,segments[i],0)
                countdown(num,digit1)

            else:
                # for i in range(7):
                #     lgpio.gpio_write(H,segments[i],0)
                countdown(0,num)

        
def start_monitoring():
    """Start monitoring the folder for new images."""
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
    observer.join()

if __name__ == "__main__":
    start_monitoring()

