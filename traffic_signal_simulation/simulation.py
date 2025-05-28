import json
import time
import sys
import lgpio
FILE_PATH = "traffic.json"
# Load existing dictionary (if available)
def load_data():
    try:
        with open(FILE_PATH, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}  # Default to empty dict if file doesn't exist or is corrupted

# Save dictionary to file
def save_data(data):
    with open(FILE_PATH, "w") as file:
        json.dump(data, file, indent=4)

traffic=load_data()
#####################################

##################### raspberry pi #########################
# H=lgpio.gpiochip_open(0)

# segments=[2,3,22,11,10,21,12]
# numbers=[
#     [0,0,0,0,0,0,1],
#     [1,0,0,1,1,1,1], 
#     [0,0,1,0,0,1,0],
#     [0,0,0,0,1,1,0],  
#     [1,0,0,1,1,0,0],  
#     [0,1,0,0,1,0,0],  
#     [0,1,0,0,0,0,0],   
#     [0,0,0,1,1,1,1],  
#     [0,0,0,0,0,0,0], 
#     [0,0,0,0,1,0,0]   
# ]
# digits=[16,20]

# lgpio.gpio_claim_output(H,digits[0])
# lgpio.gpio_claim_output(H,digits[1])

# for segment in segments:
#     lgpio.gpio_claim_output(H,segment)

###############################################################

try:
    def start():
        traffic=load_data()
        traffic[f'R1']=True
        traffic[f'R2']=True
        traffic[f'R3']=True
        traffic[f'R4']=True

        traffic[f'G1']=False
        traffic[f'G2']=False
        traffic[f'G3']=False
        traffic[f'G4']=False

        traffic[f'Y1']=False
        traffic[f'Y2']=False
        traffic[f'Y3']=False
        traffic[f'Y4']=False

        save_data(traffic)

        def find_max():
            traffic=load_data()
            traffic_list=[traffic["T1"],traffic[f"T2"],traffic[f"T3"],traffic[f"T4"]]
            tmax=max(traffic_list)
            tmaxlan=traffic_list.index(tmax)+1
            traffic_list.pop(tmaxlan-1)
            tmaxlan2=(traffic_list.index(max(traffic_list)))+1
            if(tmaxlan2>=tmaxlan):
                tmaxlan2+=1
            if(tmax==0):                
                return [tmaxlan,0,tmaxlan2,True]
            elif(tmax<=3):
                return [tmaxlan,5,tmaxlan2,False]
            elif(tmax<=5):
                return [tmaxlan,10,tmaxlan2,False]
            elif(tmax<=7):
                return [tmaxlan,15,tmaxlan2,False]
            return [tmaxlan,20,tmaxlan2,False]
        
        ###################### check any lane have traffic ##################
        def check():
            traffic=load_data()
            traffic[f'R1']=True
            traffic[f'R2']=True
            traffic[f'R3']=True
            traffic[f'R4']=True
            traffic[f'Y1']=False
            traffic[f'Y2']=False
            traffic[f'Y3']=False
            traffic[f'Y4']=False
            traffic[f'G1']=False
            traffic[f'G2']=False
            traffic[f'G3']=False
            traffic[f'G4']=False
            save_data(traffic)
            # for i in range(sys.maxsize):
            #     traffic=load_data()
            #     traffic_list=[traffic["T1"],traffic[f"T2"],traffic[f"T3"],traffic[f"T4"]]
            #     if(max(traffic_list)!=0):
            #         break
            #     time.sleep(1)
            traffic=load_data()
            while(traffic["T1"]==0 and traffic["T2"]==0 and traffic["T3"]==0 and traffic["T4"]==0):
                time.sleep(1)
                traffic=load_data()
            return start()
        ##################### Ambulance ############################
        def emergency():
            traffic=load_data()
            lane=-1
            for i in range(4):
                if(traffic[f'A{(i+1)}']):
                    lane=i+1
                    break
            if(lane==-1): return start()    

            traffic[f'R1']=True
            traffic[f'R2']=True
            traffic[f'R3']=True
            traffic[f'R4']=True
            traffic[f'Y1']=False
            traffic[f'Y2']=False
            traffic[f'Y3']=False
            traffic[f'Y4']=False
            traffic[f'G1']=False
            traffic[f'G2']=False
            traffic[f'G3']=False
            traffic[f'G4']=False

            traffic[f'R{lane}']=False
            traffic[f'G{lane}']=True
            save_data(traffic)
            i=20
            if(traffic[f'T{lane}']<=3):
                i=5
            elif(traffic[f'T{lane}']<=5):
                i=10
            elif(traffic[f'T{lane}']<=7):
                i=15
            traffic=load_data() ############
            traffic["C"]=i ############
            save_data(traffic) ############
            while(i>=0):
                print(i)
                i-=1
                time.sleep(1)
            traffic=load_data()
            if(traffic["A1"] or traffic["A2"] or traffic["A3"] or traffic["A4"]): return emergency()
            return start()
        ##############################################################

        if(traffic["A1"] or traffic["A2"] or traffic["A3"] or traffic["A4"]): return emergency()

        max_data=find_max()  
        if(max_data[3]):
            check()  
        i=max_data[1]
        traffic=load_data() ################
        traffic["C"]=i ####################
        save_data(traffic) ###########
        j=max_data[0]
        j1=0
        j2=0
        i1=0
        repeat=0

        traffic[f'R{j}']=False
        traffic[f'G{j}']=True
        save_data(traffic)
        while(i>=0):
            data=load_data()
            print(i)
            if(data["A1"] or data["A2"] or data["A3"] or data["A4"]): return emergency()
            
            if(i==3):
                max_data=find_max()
                # if(max_data[3]):
                #     check()
                i1=max_data[1]
                j1=max_data[0]
                j2=max_data[2]
                data[f'Y{j}']=True
                data[f'G{j}']=False
                if(repeat!=0 and j1==repeat and j1==j and j2!=0):
                    data[f'Y{(j2)}']=True
                    data[f'R{(j2)}']=False
                else:
                    data[f'Y{(j1)}']=True
                    data[f'R{(j1)}']=False
                save_data(data)
            if(i==0):
                max_data=find_max()
                if(max_data[3]):
                    check()
                # data[f'R{j}']=True
                # data[f'Y{j}']=False
                if(repeat!=0 and j1==repeat and j1==j and j2!=0):
                    data[f'R{j}']=True
                    data[f'Y{j}']=False
                    j1=j2
                    j=j1
                    data[f'G{j}']=True
                    data[f'Y{j}']=False

                elif(repeat!=j and j1==j ):
                    # data[f'R{j}']=True
                    data[f'Y{j}']=False
                    repeat=j
                    # j=j1
                    data[f'G{j}']=True
                    # data[f'Y{j}']=False
                else:
                    data[f'R{j}']=True
                    data[f'Y{j}']=False
                    repeat=j
                    j=j1
                    data[f'G{j}']=True
                    data[f'Y{j}']=False

                # data[f'G{j}']=True
                # data[f'Y{j}']=False
                i=i1
                data["C"]=i ###############
                save_data(data)
                # print(data)
            else:
                i-=1
            time.sleep(1)
    start()
except KeyboardInterrupt:
    print("Simulation is stop")
