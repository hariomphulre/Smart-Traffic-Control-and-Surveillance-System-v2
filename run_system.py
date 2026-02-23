import subprocess
from time import sleep

print("Starting all detection systems...")

# Use Popen to run scripts in parallel (non-blocking)
processes = []

# Start each script as a separate process
processes.append(subprocess.Popen(["python", "watchdog_simulation.py"]))
sleep(1)

processes.append(subprocess.Popen(["python", "R1_with_amb.py"]))
sleep(1) 

processes.append(subprocess.Popen(["python", "R2_with_acc.py"]))
sleep(1)

processes.append(subprocess.Popen(["python", "R3.py"]))
sleep(1)

processes.append(subprocess.Popen(["python", "R4.py"]))
sleep(1)

processes.append(subprocess.Popen(["python", r"traffic_signal_simulation/simulation.py"]))

try:
    for process in processes:
        process.wait()
except KeyboardInterrupt:
    print("\nStopping all processes...")
    for process in processes:
        process.terminate()
    print("All processes stopped.")