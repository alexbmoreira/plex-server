from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import subprocess

scheduler = BackgroundScheduler()
scheduler.start()

def turn_on_projector():
    try:
        subprocess.run(["echo", "on", "0", "|", "cec-client", "-s", "-d", "1"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to turn on projector: {e}")

def schedule_projector_job(start_time):
    scheduler = BackgroundScheduler()
    
    scheduler.add_job(turn_on_projector, 'date', run_date=start_time)
    scheduler.start()

    print(f"Scheduled job to turn on projector at {start_time}")

# Example usage: schedule a job for a specific date and time
start_time = datetime(2024, 8, 21, 21, 0)  # Year, Month, Day, Hour, Minute
schedule_projector_job(start_time)

# Keep the script running
try:
    while True:
        pass
except (KeyboardInterrupt, SystemExit):
    scheduler.shutdown()
