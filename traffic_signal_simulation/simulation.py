############### with out ambulance ########################

# import json
# import time

# FILE_PATH = "/home/pi/Desktop/Smart-Traffic-Control-and-Surveillance-System-v3.0/traffic_signal_simulation/traffic2.json"
# YELLOW_DURATION = 3
# GREEN_UNIT = 2
# GREEN_MAX = 30

# def load_data():
#     with open(FILE_PATH, "r") as file:
#         return json.load(file)

# def save_data(data):
#     with open(FILE_PATH, "w") as file:
#         json.dump(data, file, indent=4)

# def reset_lights(data):
#     for i in range(1, 5):
#         data[f"R{i}"] = True
#         data[f"G{i}"] = False
#         data[f"Y{i}"] = False
#         data[f"C{i}"] = 0

# def print_all_countdowns(data):
#     print("Countdowns -> ", end="")
#     for i in range(1, 5):
#         print(f"C{i}: {data[f'C{i}']} ", end="")
#     print()

# def get_sorted_lanes_by_traffic(data):
#     traffic = [(i, data[f"T{i}"]) for i in range(1, 5)]
#     return [lane for lane, _ in sorted(traffic, key=lambda x: x[1], reverse=True)]


# def traffic_controller():
#     while True:
#         data = load_data()
#         lane_order = get_sorted_lanes_by_traffic(data)

#         green_durations = {}
#         for lane in lane_order:
#             green_durations[lane] = min(data[f"T{lane}"] * GREEN_UNIT, GREEN_MAX)

#         for current_idx in range(4):
#             current_lane = lane_order[current_idx]
#             next_lane = lane_order[(current_idx + 1) % 4]

#             green_time = green_durations[current_lane]

#             reset_lights(data)
#             data[f"G{current_lane}"] = True
#             data[f"R{current_lane}"] = False
#             save_data(data)

#             for t in range(green_time, 0, -1):
#                 data = load_data()
#                 elapsed_green = green_time - t

#                 wait_times = {}

#                 for i in range(4):
#                     lane = lane_order[i]

#                     if lane == current_lane or lane == next_lane:
#                         wait_times[lane] = t
#                     else:
#                         idx_current = current_idx
#                         idx_lane = i
#                         steps = (idx_lane - idx_current) % 4
#                         if steps == 1:  
#                             wait_times[lane] = 0
#                         else:
#                             total_wait = 0
#                             for step in range(1, steps + 1):
#                                 lane_idx = (idx_current + step) % 4
#                                 lane_in_path = lane_order[lane_idx]
#                                 total_wait += green_durations[lane_in_path] + YELLOW_DURATION
#                             total_wait -= elapsed_green
#                             wait_times[lane] = max(total_wait, 0)

#                 for lane_num in range(1, 5):
#                     data[f"C{lane_num}"] = wait_times.get(lane_num, 0)

#                 for lane_num in range(1, 5):
#                     data[f"G{lane_num}"] = False
#                     data[f"Y{lane_num}"] = False
#                     data[f"R{lane_num}"] = True

#                 if t <= YELLOW_DURATION:
#                     data[f"Y{current_lane}"] = True
#                     data[f"R{current_lane}"] = False
#                     data[f"Y{next_lane}"] = True
#                     data[f"R{next_lane}"] = False
#                 else:
#                     data[f"G{current_lane}"] = True
#                     data[f"R{current_lane}"] = False

#                 save_data(data)
#                 print_all_countdowns(data)
#                 time.sleep(1)

#             # After green ends, turn current lane red and remove yellows
#             data = load_data()
#             data[f"Y{current_lane}"] = False
#             data[f"R{current_lane}"] = True
#             data[f"C{current_lane}"] = 0
#             data[f"Y{next_lane}"] = False
#             save_data(data)
#             print_all_countdowns(data)
#             time.sleep(1)

# if __name__ == "__main__":
#     traffic_controller()


#########################   With Ambulance    ########################

# import json
# import time

# FILE_PATH = "/home/pi/Desktop/Smart-Traffic-Control-and-Surveillance-System-v3.0/traffic_signal_simulation/traffic2.json"
# YELLOW_DURATION = 3
# GREEN_UNIT = 2
# GREEN_MAX = 30

# def load_data():
#     with open(FILE_PATH, "r") as file:
#         return json.load(file)

# def save_data(data):
#     with open(FILE_PATH, "w") as file:
#         json.dump(data, file, indent=4)

# def reset_lights(data):
#     for i in range(1, 5):
#         data[f"R{i}"] = True
#         data[f"G{i}"] = False
#         data[f"Y{i}"] = False
#         data[f"C{i}"] = 0

# def print_all_countdowns(data):
#     print("Countdowns -> ", end="")
#     for i in range(1, 5):
#         print(f"C{i}: {data[f'C{i}']} ", end="")
#     print()

# def get_sorted_lanes_by_traffic(data):
#     traffic = [(i, data[f"T{i}"]) for i in range(1, 5)]
#     return [lane for lane, _ in sorted(traffic, key=lambda x: x[1], reverse=True)]

# def get_ambulance_lane(data):
#     for i in range(1, 5):
#         if data.get(f"A{i}", False):
#             return i
#     return None

# def traffic_controller():
#     while True:
#         data = load_data()

#         ambulance_lane = get_ambulance_lane(data)
#         if ambulance_lane:
#             reset_lights(data)
#             data[f"G{ambulance_lane}"] = True
#             data[f"R{ambulance_lane}"] = False
#             save_data(data)

#             fixed_green_time = 10
#             for t in range(fixed_green_time, 0, -1):
#                 data = load_data()

#                 for i in range(1, 5):
#                     data[f"C{i}"] = t if i == ambulance_lane else 0

#                 if t <= YELLOW_DURATION:
#                     data[f"G{ambulance_lane}"] = False
#                     data[f"Y{ambulance_lane}"] = True

#                 save_data(data)
#                 print_all_countdowns(data)
#                 time.sleep(1)

#                 if not data.get(f"A{ambulance_lane}", False):
#                     break

#             data = load_data()
#             data[f"Y{ambulance_lane}"] = False
#             data[f"R{ambulance_lane}"] = True
#             data[f"C{ambulance_lane}"] = 0
#             save_data(data)
#             print_all_countdowns(data)
#             time.sleep(1)
#             continue  # go to next loop to recheck

#         #Normal traffic flow
#         data = load_data()
#         lane_order = get_sorted_lanes_by_traffic(data)

#         green_durations = {}
#         for lane in lane_order:
#             green_durations[lane] = min(data[f"T{lane}"] * GREEN_UNIT, GREEN_MAX)

#         for current_idx in range(4):
#             if get_ambulance_lane(load_data()):
#                 break  # break to handle ambulance in next outer loop

#             current_lane = lane_order[current_idx]
#             next_lane = lane_order[(current_idx + 1) % 4]
#             green_time = green_durations[current_lane]

#             reset_lights(data)
#             data[f"G{current_lane}"] = True
#             data[f"R{current_lane}"] = False
#             save_data(data)

#             for t in range(green_time, 0, -1):
#                 data = load_data()

#                 ambulance_now = get_ambulance_lane(data)
#                 if ambulance_now:
#                     break

#                 elapsed_green = green_time - t
#                 wait_times = {}

#                 for i in range(4):
#                     lane = lane_order[i]
#                     if lane == current_lane or lane == next_lane:
#                         wait_times[lane] = t
#                     else:
#                         idx_current = current_idx
#                         idx_lane = i
#                         steps = (idx_lane - idx_current) % 4
#                         if steps == 1:
#                             wait_times[lane] = 0
#                         else:
#                             total_wait = 0
#                             for step in range(1, steps + 1):
#                                 lane_idx = (idx_current + step) % 4
#                                 lane_in_path = lane_order[lane_idx]
#                                 total_wait += green_durations[lane_in_path] + YELLOW_DURATION
#                             total_wait -= elapsed_green
#                             wait_times[lane] = max(total_wait, 0)

#                 for lane_num in range(1, 5):
#                     data[f"C{lane_num}"] = wait_times.get(lane_num, 0)

#                 for lane_num in range(1, 5):
#                     data[f"G{lane_num}"] = False
#                     data[f"Y{lane_num}"] = False
#                     data[f"R{lane_num}"] = True

#                 if t <= YELLOW_DURATION:
#                     data[f"Y{current_lane}"] = True
#                     data[f"R{current_lane}"] = False
#                     data[f"Y{next_lane}"] = True
#                     data[f"R{next_lane}"] = False
#                 else:
#                     data[f"G{current_lane}"] = True
#                     data[f"R{current_lane}"] = False

#                 save_data(data)
#                 print_all_countdowns(data)
#                 time.sleep(1)

#             data = load_data()
#             data[f"Y{current_lane}"] = False
#             data[f"R{current_lane}"] = True
#             data[f"C{current_lane}"] = 0
#             data[f"Y{next_lane}"] = False
#             save_data(data)
#             print_all_countdowns(data)
#             time.sleep(1)

# if __name__ == "__main__":
#     traffic_controller()





import json
import time


FILE_PATH = "./traffic_signal_simulation/traffic.json"

YELLOW_DURATION = 3
GREEN_UNIT = 2
GREEN_MAX = 30

def load_data():
    with open(FILE_PATH, "r") as file:
        return json.load(file)

def save_data(data):
    with open(FILE_PATH, "w") as file:
        json.dump(data, file, indent=4)

def reset_lights(data):
    for i in range(1, 5):
        data[f"R{i}"] = True
        data[f"G{i}"] = False
        data[f"Y{i}"] = False
        data[f"C{i}"] = 0

def print_all_countdowns(data):
    print("Countdowns -> ", end="")
    for i in range(1, 5):
        print(f"C{i}: {data[f'C{i}']} ", end="")
    print()

def get_sorted_lanes_by_traffic(data):
    traffic = [(i, data[f"T{i}"]) for i in range(1, 5)]
    return [lane for lane, _ in sorted(traffic, key=lambda x: x[1], reverse=True)]

def get_ambulance_lane(data):
    for i in range(1, 5):
        if data.get(f"A{i}", False):
            return i
    return None

def traffic_controller():
    while True:
        data = load_data()

        ambulance_lane = get_ambulance_lane(data)
        if ambulance_lane:
            reset_lights(data)
            data[f"G{ambulance_lane}"] = True
            data[f"R{ambulance_lane}"] = False
            save_data(data)

            # fixed_green_time = 10
            # for t in range(fixed_green_time, 0, -1):

            while(ambulance_lane):
                data = load_data()

                data[f"C{ambulance_lane}"] = 0

                # for i in range(1, 5):
                #     data[f"C{i}"] = t if i == ambulance_lane else 0

                # if t <= YELLOW_DURATION:
                #     data[f"G{ambulance_lane}"] = False
                #     data[f"Y{ambulance_lane}"] = True

                save_data(data)
                print_all_countdowns(data)
                time.sleep(1)

                if not data.get(f"A{ambulance_lane}", False):
                    break

            data = load_data()
            data[f"Y{ambulance_lane}"] = False
            data[f"R{ambulance_lane}"] = True
            data[f"C{ambulance_lane}"] = 0
            save_data(data)
            print_all_countdowns(data)
            time.sleep(1)
            continue  # go to next loop to recheck

        #Normal traffic flow
        data = load_data()
        lane_order = get_sorted_lanes_by_traffic(data)

        green_durations = {}
        for lane in lane_order:
            green_durations[lane] = min(data[f"T{lane}"] * GREEN_UNIT, GREEN_MAX)

        for current_idx in range(4):
            if get_ambulance_lane(load_data()):
                break 

            current_lane = lane_order[current_idx]
            next_lane = lane_order[(current_idx + 1) % 4]
            green_time = green_durations[current_lane]

            reset_lights(data)
            data[f"G{current_lane}"] = True
            data[f"R{current_lane}"] = False
            save_data(data)

            for t in range(green_time, 0, -1):
                data = load_data()

                ambulance_now = get_ambulance_lane(data)
                if ambulance_now:
                    break

                elapsed_green = green_time - t
                wait_times = {}

                for i in range(4):
                    lane = lane_order[i]
                    if lane == current_lane or lane == next_lane:
                        wait_times[lane] = t
                    else:
                        idx_current = current_idx
                        idx_lane = i
                        steps = (idx_lane - idx_current) % 4
                        if steps == 1:
                            wait_times[lane] = 0
                        else:
                            total_wait = 0
                            for step in range(1, steps + 1):
                                lane_idx = (idx_current + step) % 4
                                lane_in_path = lane_order[lane_idx]
                                total_wait += green_durations[lane_in_path] + YELLOW_DURATION
                            total_wait -= elapsed_green
                            wait_times[lane] = max(total_wait, 0)

                for lane_num in range(1, 5):
                    data[f"C{lane_num}"] = wait_times.get(lane_num, 0)

                for lane_num in range(1, 5):
                    data[f"G{lane_num}"] = False
                    data[f"Y{lane_num}"] = False
                    data[f"R{lane_num}"] = True

                if t <= YELLOW_DURATION:
                    data[f"Y{current_lane}"] = True
                    data[f"R{current_lane}"] = False
                    data[f"Y{next_lane}"] = True
                    data[f"R{next_lane}"] = False
                else:
                    data[f"G{current_lane}"] = True
                    data[f"R{current_lane}"] = False

                save_data(data)
                print_all_countdowns(data)
                time.sleep(1)

            data = load_data()
            data[f"Y{current_lane}"] = False
            data[f"R{current_lane}"] = True
            data[f"C{current_lane}"] = 0
            data[f"Y{next_lane}"] = False
            save_data(data)
            print_all_countdowns(data)
            time.sleep(1)

if __name__ == "__main__":
    traffic_controller()