import os
import subprocess
from time import sleep

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIMULATION_DIR = os.path.join(SCRIPT_DIR, "..", "traffic_signal_simulation")

print("Starting all detection systems...")

processes = []

processes.append(subprocess.Popen(["python", "watchdog_simulation.py"], cwd=SCRIPT_DIR))
sleep(1)

processes.append(subprocess.Popen(["python", "R1_with_amb.py"], cwd=SCRIPT_DIR))
sleep(1)

processes.append(subprocess.Popen(["python", "R2_with_acc.py"], cwd=SCRIPT_DIR))
sleep(1)

processes.append(subprocess.Popen(["python", "R3.py"], cwd=SCRIPT_DIR))
sleep(1)

processes.append(subprocess.Popen(["python", "R4.py"], cwd=SCRIPT_DIR))
sleep(1)

processes.append(subprocess.Popen(["python", "simulation.py"], cwd=SIMULATION_DIR))

try:
    for process in processes:
        process.wait()
except KeyboardInterrupt:
    print("\nStopping all processes...")
    for process in processes:
        process.terminate()
    print("All processes stopped.")