import os
import sys
import argparse
import glob
import time
import json
import cv2
import numpy as np
from ultralytics import YOLO
import PIL.Image
# import google.generativeai as genai
# genai.configure(api_key="AIzaSyDX9D290jNNJ0e6MShOt3S8v_xPz6ZNwXw")
import json
import shutil
from filelock import FileLock
# import boto3
# s3=boto3.resource('s3')

# import matplotlib.pyplot as plt
# import easyocr

# Define and parse user input arguments

parser = argparse.ArgumentParser()
parser.add_argument('--model', help='Path to YOLO model file (example: "runs/detect/train/weights/best.pt")',
                    required=True)
parser.add_argument('--source', help='Image source, can be image file ("test.jpg"), \
                    image folder ("test_dir"), video file ("testvid.mp4"), or index of USB camera ("usb0")', 
                    required=True)
parser.add_argument('--thresh', help='Minimum confidence threshold for displaying detected objects (example: "0.4")',
                    default=0.5)
parser.add_argument('--resolution', help='Resolution in WxH to display inference results at (example: "640x480"), \
                    otherwise, match source resolution',
                    default=None)
parser.add_argument('--record', help='Record results from video or webcam and save it as "demo1.avi". Must specify --resolution argument to record.',
                    action='store_true')

args = parser.parse_args()


# Parse user inputs
model_path = args.model
img_source = args.source
min_thresh = args.thresh
user_res = args.resolution
record = args.record

# Check if model file exists and is valid
if (not os.path.exists(model_path)):
    print('ERROR: Model path is invalid or model was not found. Make sure the model filename was entered correctly.')
    sys.exit(0)

# Load the model into memory and get labemap
model = YOLO(model_path, task='detect')
labels = model.names

# Parse input to determine if image source is a file, folder, video, or USB camera
img_ext_list = ['.jpg','.JPG','.jpeg','.JPEG','.png','.PNG','.bmp','.BMP']
vid_ext_list = ['.avi','.mov','.mp4','.mkv','.wmv']

if os.path.isdir(img_source):
    source_type = 'folder'
elif os.path.isfile(img_source):
    _, ext = os.path.splitext(img_source)
    if ext in img_ext_list:
        source_type = 'image'
    elif ext in vid_ext_list:
        source_type = 'video'
    else:
        print(f'File extension {ext} is not supported.')
        sys.exit(0)
elif 'usb' in img_source:
    source_type = 'usb'
    usb_idx = int(img_source[3:])
elif 'picamera' in img_source:
    source_type = 'picamera'
    picam_idx = int(img_source[8:])
else:
    print(f'Input {img_source} is invalid. Please try again.')
    sys.exit(0)

# Parse user-specified display resolution
resize = False
if user_res:
    resize = True
    resW, resH = int(user_res.split('x')[0]), int(user_res.split('x')[1])

# Check if recording is valid and set up recording
if record:
    if source_type not in ['video','usb']:
        print('Recording only works for video and camera sources. Please try again.')
        sys.exit(0)
    if not user_res:
        print('Please specify resolution to record video at.')
        sys.exit(0)
    
    # Set up recording
    record_name = 'demo1.avi'
    record_fps = 30
    recorder = cv2.VideoWriter(record_name, cv2.VideoWriter_fourcc(*'MJPG'), record_fps, (resW,resH))

# Load or initialize image source
if source_type == 'image':
    imgs_list = [img_source]
elif source_type == 'folder':
    imgs_list = []
    filelist = glob.glob(img_source + '/*')
    for file in filelist:
        _, file_ext = os.path.splitext(file)
        if file_ext in img_ext_list:
            imgs_list.append(file)
elif source_type == 'video' or source_type == 'usb':

    if source_type == 'video': cap_arg = img_source
    elif source_type == 'usb': cap_arg = usb_idx
    cap = cv2.VideoCapture(cap_arg)

    # Set camera or video resolution if specified by user
    if user_res:
        ret = cap.set(3, resW)
        ret = cap.set(4, resH)

elif source_type == 'picamera':
    from picamera2 import Picamera2
    cap = Picamera2()
    cap.configure(cap.create_video_configuration(main={"format": 'XRGB8888', "size": (resW, resH)}))
    cap.start()

# Set bounding box colors (using the Tableu 10 color scheme)
# bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106), 
#               (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)]
bbox_colors = [(0,255,0), (0,255,0), (0,255,0), (255,0,0), (255,0,0), 
              (0,255,0)]

# Initialize control and status variables
avg_frame_rate = 0
frame_rate_buffer = []
fps_avg_len = 200
img_count = 0

################ coordinates ##################################
points = []

# Mouse callback function to get coordinates
def get_coordinates(event, x, y, flags, param):
    global points, frame
    if event == cv2.EVENT_LBUTTONDOWN:  # Left mouse button click
        points.append((x, y))
        print(f"Point {len(points)}: ({x}, {y})")

        # Draw a red dot at the clicked point
        cv2.circle(frame, (x, y), 5, (0, 0, 255), -1)

        # If two points are selected, draw a line
        if len(points) == 2:
            cv2.line(frame, points[0], points[1], (0, 255, 0), 2)
        
        cv2.imshow("YOLO detection results", frame)
################################################

###### Dictionary to store obj counts by class ##########
class_counts_1={  # for line 1
    "license_plate":0,
    "helmet":0,
    "car":0,
    "bike":0,
    "bus":0,
    "truck":0,
}
# class_counts_2={  # for line 2
#     "license_plate":0
# }
# class_counts_helmet={  # only for line 1
#     "helmet":0
# }
######### dict to keep track of obj ID's that have crossed the line ################
crossed_ids=set()
##################################################

# line coordinates
line1_x1=0 #243 
line1_y1=490
line1_x2=1280
line1_y2=490

# line2_x1=675
# line2_y1=451
# line2_x2=954
# line2_y2=451

###################### store all detected images ###################
output_dir="local_data/all_vehicle_detected_img"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

################# store license img with its vehicle track_id
output_dir3="local_data/all_license_plate_img"
if not os.path.exists(output_dir3):
    os.makedirs(output_dir3)

##################### store sort detected license plate image ##################
output_dir2="local_data/new_sort_license_plate_img"
if not os.path.exists(output_dir2):
    os.makedirs(output_dir2)
# track sort detected conf 
track_sort_conf={} # vehicle track id
###################################################

# store confidence ans track_id to extract highiest license cofidence image
track_conf={}

####################### track time to calculate speed ###########################
time1={}
track_speed={}
###################################################################
# Begin inference loop
while True:

    t_start = time.perf_counter()

    # Load frame from image source
    if source_type == 'image' or source_type == 'folder': # If source is image or image folder, load the image using its filename
        if img_count >= len(imgs_list):
            print('All images have been processed. Exiting program.')
            sys.exit(0)
        img_filename = imgs_list[img_count]
        frame = cv2.imread(img_filename)
        img_count = img_count + 1
    
    elif source_type == 'video': # If source is a video, load next frame from video file
        ret, frame = cap.read()
        if not ret:
            print('Reached end of the video file. Exiting program.')
            break
    
    elif source_type == 'usb': # If source is a USB camera, grab frame from camera
        ret, frame = cap.read()
        if (frame is None) or (not ret):
            print('Unable to read frames from the camera. This indicates the camera is disconnected or not working. Exiting program.')
            break

    elif source_type == 'picamera': # If source is a Picamera, grab frames using picamera interface
        frame_bgra = cap.capture_array()
        frame = cv2.cvtColor(np.copy(frame_bgra), cv2.COLOR_BGRA2BGR)
        if (frame is None):
            print('Unable to read frames from the Picamera. This indicates the camera is disconnected or not working. Exiting program.')
            break

    # Resize frame to desired display resolution
    if resize == True:
        frame = cv2.resize(frame,(resW,resH))
    
    ######################################
    # Run inference on frame
    # results = model(frame, verbose=False) # default 
    results=model.track(frame,persist=True) # by hariom
    #######################################################


    # Extract results
    detections = results[0].boxes

    #####################################
    # Track id
    if(results[0].boxes.id is not None):
        track_ids=results[0].boxes.id.int().cpu().tolist()
    else:
        continue
    #####################################

    # Initialize variable for basic object counting example
    object_count = 0

    ######### read license plate #################
    # reader=easyocr.Reader(['en'])
    #############################

    ############## json file to store helmet data with vehicle track id #############
    FILE_PATH = r"/home/pi/Desktop/stcnss/Smart-Traffic-Control-and-Surveillance-System/local_data/helmet_data.json"
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

    helmet_dict=load_dict()

    #################### json file to store speed data #############################
    FILE_PATH2= r"/home/pi/Desktop/stcnss/Smart-Traffic-Control-and-Surveillance-System/local_data/speed_data.json"
    def load_dict2():
        try:
            with open(FILE_PATH2, "r") as file2:
                return json.load(file2)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    def save_dict2(data2):
        with open(FILE_PATH2,"w") as file2:
            json.dump(data2,file2,indent=4)
    speed_dict=load_dict2()

    ################# UPDATE TRAFFIC VOLUME TO JSON ####################
    FILE_PATH3 = r"/home/pi/Desktop/stcnss/Smart-Traffic-Control-and-Surveillance-System/demo/traffic.json"
    TEMP_PATH3 = FILE_PATH3 + ".tmp"
    LOCK_PATH3 = FILE_PATH3 + ".lock"  # Lock file will have the same name as the original file with ".lock" extension

    def load_dict3():
        try:
            with FileLock(LOCK_PATH3):  # Lock the file during reading
                with open(FILE_PATH3, "r") as file3:
                    return json.load(file3)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"[ERROR] load_dict3: {e}")
            return {}

    def save_dict3(data3):
        try:
            with FileLock(LOCK_PATH3):  # Lock the file during writing
                with open(TEMP_PATH3, "w") as temp_file:
                    json.dump(data3, temp_file, indent=4)
                shutil.move(TEMP_PATH3, FILE_PATH3)  # Move the temporary file to the original file
        except Exception as e:
            print(f"[ERROR] save_dict3: {e}")
            if os.path.exists(TEMP_PATH3):
                os.remove(TEMP_PATH3)
    time.sleep(0.1)


    # FILE_PATH3=r"C:\Users\hario\OneDrive\Desktop\Github\Smart-Traffic-Control-and-Surveillance-System\demo\traffic.json"
    # TEMP_PATH3 = FILE_PATH3 + ".tmp"
    # def load_dict3():
    #     try:
    #         with open(FILE_PATH3, "r") as file3:
    #             return json.load(file3)
    #     except (FileNotFoundError, json.JSONDecodeError) as e:
    #         print(f"[ERROR] load_dict3: {e}")
    #         return {}

    # def save_dict3(data3):
    #     try:
    #         with open(TEMP_PATH3, "w") as temp_file:
    #             json.dump(data3, temp_file, indent=4)
    #         shutil.move(TEMP_PATH3, FILE_PATH3)
    #     except Exception as e:
    #         print(f"[ERROR] save_dict3: {e}")
    #         if os.path.exists(TEMP_PATH3):
    #             os.remove(TEMP_PATH3)
    # time.sleep(0.1) 
    
    
    # def load_dict3():
    #     # try:
    #     with open(FILE_PATH3, "r") as file3:
    #         return json.load(file3)
    #     # except (FileNotFoundError, json.JSONDecodeError):
    #     #     return {}
    # def save_dict3(data3):
    #     with open(FILE_PATH3,"w") as file3:
    #         json.dump(data3,file3,indent=4)
    traffic_vol_dict=load_dict3()


    ############### create lists to store track_id, and coordinates to check detected helmet or license_plate of which vehicle #############
    cirx_special=[] # for helemt & license_plate
    ciry_special=[] # for helemt & license_plate
    classname_special=[] # for helemt & license
    track_id_special=[] # for helmet & license
    track_id_vehicle_special=[]
    vehicle_xmin=[]
    vehicle_ymin=[]
    vehicle_xmax=[]
    vehicle_ymax=[]
    ##################################################

    # Go through each detection and get bbox coords, confidence, and class
    for i in range(len(detections)):

        # Get bounding box coordinates
        # Ultralytics returns results in Tensor format, which have to be converted to a regular Python array
        xyxy_tensor = detections[i].xyxy.cpu() # Detections in Tensor format in CPU memory
        xyxy = xyxy_tensor.numpy().squeeze() # Convert tensors to Numpy array
        xmin, ymin, xmax, ymax = xyxy.astype(int) # Extract individual coordinates and convert to int

        # Get bounding box class ID and name
        classidx = int(detections[i].cls.item())
        classname = labels[classidx]
        
        #################################
        track_id=track_ids[i]
        ##############################

        # Get bounding box confidence
        conf = detections[i].conf.item()

        # Draw box if confidence threshold is high enough
        if conf > 0.5:


            ############## extract detected image and read it ##################
            crop_img=frame[ymin:ymax, xmin:xmax].copy()
            # license_plate_gray=cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
            # _, license_plate_thresh=cv2.threshold(license_plate_gray, 64, 255, cv2.THRESH_BINARY_INV)
            # output=reader.readtext(license_plate_thresh,detail=0)
            ######################################################

            color = bbox_colors[classidx % 10]
            cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), color, 1)

            label = f'ID: {track_id}, {classname}: {int(conf*100)}%'
            labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1) # Get font size
            label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
            cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), color, cv2.FILLED) # Draw white box to put label text in
            cv2.putText(frame,label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1) # Draw label text
            ###########################################
            cirx=(xmax+xmin)//2
            ciry=(ymax+ymin)//2
            # cv2.circle(frame,(cirx,ciry),1,(0,0,255),3)

            ########################### speed ##################################
            if(cirx>=line1_x1 and cirx<=line1_x2 and ciry>465 and ciry<line1_y1):
                if(track_id not in time1):
                    time1[track_id]=time.time()
            if(track_id in time1 and ciry>=line1_y1):
                timeDiff=time.time()-time1[track_id]
                speed=10/timeDiff # m/h
                speed*=3.6 # km/h
                if(track_id not in track_speed):
                    track_speed[track_id]=speed
                    speed_dict=load_dict2()
                    speed_dict.update({(f"{track_id}"): int(speed)})
                    save_dict2(speed_dict)
            
            if(track_id in track_speed):
                if(track_speed[track_id]<=40):
                    color=(0,255,0)
                elif(track_speed[track_id]<=80):
                    color=(0,255,255)
                else:
                    color=(0,0,255)
                cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-30), (xmin+labelSize[0], label_ymin+baseLine-30), color, cv2.FILLED)
                cv2.putText(frame,str(int(track_speed[track_id]))+' km/h',(xmin,label_ymin-28),cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
            #######################################################################

            

            ############### store class for check which license plate & helmet belong to which vehicle #########
            if(classname=="helmet" or classname=="license_plate"):
                classname_special.append(classname)
                # track centre and track id only of this frame to check which helmet or license plate belongs to trafic id ######################
                cirx_special.append(float(cirx))
                ciry_special.append(float(ciry))
                track_id_special.append(track_id)
            ############## store vehicle data for check which helmet or license plate belongs to trafic id ###############################
            else:
                track_id_vehicle_special.append(track_id)
                vehicle_xmin.append(float(xmin))
                vehicle_ymin.append(float(ymin))
                vehicle_xmax.append(float(xmax))
                vehicle_ymax.append(float(ymax))
            #############################################################################

            # Check the obj is crossed the line
            # Note for all line y is same
            # for line1
            # if(classname=="car" or classname=="bike" or classname=="bus" or classname=="truck"):
            if ciry>line1_y1 and cirx>=line1_x1 and cirx<=line1_x2 and track_id not in crossed_ids:
                crossed_ids.add(track_id)
                class_counts_1[classname]+=1
            #for line2
            # if ciry<line2_y2 and cirx>=line2_x1 and cirx<=line2_x2 and track_id not in crossed_ids:
            #     crossed_ids.add(track_id)
            #     class_counts_2[classname]+=1
            ############################################

            ########### Gemini API to extract text from crop_img ####################
            
            # def upload_file(path):
            #     file=genai.upload_file(path)
            #     print(f'uploaded file {file.display_name} at {file.uri}')
            #     return file
            # generation_config={
            #     "temperature":1,
            #     "top_p":0.95,
            #     "max_output_tokens": 8192,
            # }

            # genmodel= genai.GenerativeModel(
            #     model_name="gemini-2.0-flash-lite",
            #     generation_config=generation_config,
            # )
            
            ############################################################################

            ######### track conf of detectded image ################
            if track_id not in track_conf:
                track_conf.update({track_id:float(f'{conf:.2f}')})
                vehicle_file=f"{output_dir}/{labels[classidx]}_{track_id}.jpg"
                cv2.imwrite(vehicle_file,crop_img)
                ######### upload on sort_detected_image ##############
                if(classname=="license_plate"):
                    if(conf<0.57):
                        track_sort_conf.update({track_id:False})
                    else:
                        track_sort_conf.update({track_id:True})
                    vehicle_file2=f"{output_dir2}/{labels[classidx]}_{track_id}.jpg"
                    cv2.imwrite(vehicle_file2,crop_img)
                ########### upload crop_img on AWS S3 ################
                # s3.meta.client.upload_file(vehicle_file, 'license-img-data', f'{labels[classidx]}_{track_id}.jpg')
                ############ Gemini ####################
                # files=[upload_file(vehicle_file)]

                # response=genmodel.generate_content([
                #     files[0],
                #     "Extract the text from image (one word answer)",
                # ])
                ############ update helmet_data.json #############
                if(classname=="bike"):
                    helmet_dict=load_dict()
                    helmet_dict.update({(f"{track_id}"): False})
                    save_dict(helmet_dict)
                ###############################################
                print(f"Saved: {vehicle_file}, conf: {conf:.2f}")
                # print(f"updated: helmet_data.json, track_id: {track_id}, License no. [{response.text}]")

            elif track_id in track_conf and conf > track_conf[track_id]:
                track_conf.update({track_id:float(f'{conf:.2f}')})
                vehicle_file=f"{output_dir}/{labels[classidx]}_{track_id}.jpg"
                cv2.imwrite(vehicle_file,crop_img)
                ######### upload on sort_detected_image ##############
                if(classname=="license_plate" and conf>=0.57 and not track_sort_conf[track_id]):
                    vehicle_file2=f"{output_dir2}/{labels[classidx]}_{track_id}.jpg"
                    cv2.imwrite(vehicle_file2,crop_img)
                    track_sort_conf[track_id]=True
                ########### upload crop_img on AWS S3 ################
                # s3.meta.client.upload_file(vehicle_file, 'license-img-data', f'{labels[classidx]}_{track_id}.jpg')
                ############# Gemini ##############
                # files=[upload_file(vehicle_file)]

                # response=genmodel.generate_content([
                #     files[0],
                #     "Extract the text from image (one word answer)",
                # ])
                ############ update helmet_data.json #############
                if(classname=="bike"):
                    helmet_dict=load_dict()
                    helmet_dict.update({(f"{track_id}"): False})
                    save_dict(helmet_dict)
                ###############################################
                print(f"Saved: {vehicle_file}, conf: {conf:.2f}")
                # print(f"updated: helmet_data.json, track_id: {track_id}, License no. [{response.text}]")

            ############################################################################
            
            # Basic example: count the number of objects in the image
            if(classname=="car" or classname=="bike" or classname=="truck" or classname=="bus"):
                object_count = object_count + 1

            ################ UPDATE TRAFFIC_VOL_DICT ###################
            traffic_vol_dict.update({"T4":object_count})
            save_dict3(traffic_vol_dict)
            ##############################################################

    ############ check helemt and license plate belongs to which vehicle  ########################################
    helmet_dict=load_dict()
    # print(classname_special)
    # print(cirx_special)
    # print(ciry_special)
    # print(track_id_vehicle_special)
    # print(vehicle_xmin)
    # print(vehicle_xmax)
    for i in range(len(track_id_vehicle_special)):
        for j in range(len(classname_special)):
            # if((cirx_special[j]<=vehicle_xmax[i]) and (cirx_special[j]>=vehicle_xmin[i]) and (ciry_special[j]<=vehicle_ymax[i]) and (ciry_special[j]>=vehicle_ymin[i])):
            if((cirx_special[j]<=vehicle_xmax[i]) and (cirx_special[j]>=vehicle_xmin[i])):
                if(classname_special[j]=="helmet"):
                    # update helmet_data.json
                    helmet_dict=load_dict()
                    helmet_dict.update({(f"{track_id_vehicle_special[i]}"): True})
                    save_dict(helmet_dict)
                if(classname_special[j]=="license_plate" and (ciry_special[j]<=vehicle_ymax[i]) and (ciry_special[j]>=vehicle_ymin[i])):
                    license_file=f"{output_dir3}/{classname_special[j]}_{track_id_vehicle_special[i]}.jpg"
                    image_path=f"{output_dir}/license_plate_{track_id_special[j]}.jpg"
                    license_img=cv2.imread(image_path)
                    cv2.imwrite(license_file,license_img)

    ##############################################################################


    
    # Calculate and draw framerate (if using video, USB, or Picamera source)
    if source_type == 'video' or source_type == 'usb' or source_type == 'picamera':
        cv2.putText(frame, f'FPS: {avg_frame_rate:0.2f}', (10,20), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,0,0), 2) # Draw framerate
        cv2.putText(frame, f'R4', (40,20), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,0,0), 4)
    
    # Display detection results


    ##################### coordinates ####################################
    cv2.namedWindow("YOLO detection results")
    cv2.setMouseCallback("YOLO detection results", get_coordinates)
    ##################### draw line ###############################
    cv2.line(frame, (line1_x1, line1_y1) , (line1_x2, line1_y2), (0,0,255), 3) # (Hariom) draw horizontal line
    # cv2.line(frame, (line2_x1, line2_y1) , (line2_x2, line2_y2), (0,0,255), 3) # (Hariom) draw horizontal line
    ######################### class counts #############################
    #for line 1
    without_helmet=class_counts_1["bike"]-class_counts_1["helmet"]
    # cv2.putText(frame, f'Up Side',  (10,60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,225,225), 2)
    cv2.putText(frame, f'with Helmet: {class_counts_1["helmet"]}', (10,80), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    cv2.putText(frame, f'without Helmet: {without_helmet}', (10,100), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    cv2.putText(frame, f'Car: {class_counts_1["car"]}', (10,120), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    cv2.putText(frame, f'Bike: {class_counts_1["bike"]}', (10,140), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    cv2.putText(frame, f'Bus: {class_counts_1["bus"]}', (10,160), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    cv2.putText(frame, f'Truck: {class_counts_1["truck"]}', (10,180), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    # #for line 2 (not completed)
    # cv2.putText(frame, f'Down Side',  (10,160), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,225,225), 2)
    # cv2.putText(frame, f'with Helmet: {class_counts_2["helmet"]}', (10,180), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    # cv2.putText(frame, f'without Helmet: {class_counts_2["helmet"]}', (10,180), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    # cv2.putText(frame, f'license_plate: {class_counts_2["license_plate"]}', (10,200), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    # cv2.putText(frame, f'Car: {class_counts_2["car"]}', (10,220), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    # cv2.putText(frame, f'Bus: {class_counts_2["bus"]}', (10,240), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    # cv2.putText(frame, f'Truck: {class_counts_2["truck"]}', (10,260), cv2.FONT_HERSHEY_SIMPLEX, .7, (255,0,0), 2)
    ########################################################################

    cv2.putText(frame, f'Objects: {object_count}', (10,40), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,0,0), 2) # Draw total number of detected objects
    cv2.imshow('YOLO detection results',frame) # Display image
    if record: recorder.write(frame)

    # If inferencing on individual images, wait for user keypress before moving to next image. Otherwise, wait 5ms before moving to next frame.
    if source_type == 'image' or source_type == 'folder':
        key = cv2.waitKey()
    elif source_type == 'video' or source_type == 'usb' or source_type == 'picamera':
        key = cv2.waitKey(5)
    
    if key == ord('q') or key == ord('Q'): # Press 'q' to quit
        break
    elif key == ord('s') or key == ord('S'): # Press 's' to pause inference
        cv2.waitKey()
    elif key == ord('p') or key == ord('P'): # Press 'p' to save a picture of results on this frame
        cv2.imwrite('capture.png',frame)
    
    # Calculate FPS for this frame
    t_stop = time.perf_counter()
    frame_rate_calc = float(1/(t_stop - t_start))

    # Append FPS result to frame_rate_buffer (for finding average FPS over multiple frames)
    if len(frame_rate_buffer) >= fps_avg_len:
        temp = frame_rate_buffer.pop(0)
        frame_rate_buffer.append(frame_rate_calc)
    else:
        frame_rate_buffer.append(frame_rate_calc)

    # Calculate average FPS for past frames
    avg_frame_rate = np.mean(frame_rate_buffer)


# Clean up
print(f'Average pipeline FPS: {avg_frame_rate:.2f}')
if source_type == 'video' or source_type == 'usb':
    cap.release()
elif source_type == 'picamera':
    cap.stop()
if record: recorder.release()
cv2.destroyAllWindows()





