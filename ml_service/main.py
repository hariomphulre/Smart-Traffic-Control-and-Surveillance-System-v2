import asyncio
import json
import os
import shutil
import subprocess
import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from filelock import FileLock
from pydantic import BaseModel, Field

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None


ROOT_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
VIDEOS_DIR = ROOT_DIR / "videos"
STREAMS_DIR = ROOT_DIR / "streams"
MODELS_DIR = ROOT_DIR / "models"
TRAFFIC_JSON = ROOT_DIR / "traffic_signal_simulation" / "traffic.json"
TRAFFIC_LOCK = Path(str(TRAFFIC_JSON) + ".lock")
SIMULATION_SCRIPT = ROOT_DIR / "traffic_signal_simulation" / "simulation.py"

SCRIPT_BY_PARTITION = {
    1: "partition1_stream.py",
    2: "partition2_stream.py",
    3: "partition3_stream.py",
    4: "partition4_stream.py",
}

# DEFAULT_MODEL = os.getenv("ML_DEFAULT_MODEL", "new_car4_with_helmet.pt")
DEFAULT_MODEL = "yolo26n.pt"
DEFAULT_RESOLUTION = os.getenv("ML_DEFAULT_RESOLUTION", "500x300")
REDIS_URL = os.getenv("REDIS_URL", "")
STATS_CHANNEL = "simulation:stats"
ML_MAX_PARTITIONS = max(1, min(4, int(os.getenv("ML_MAX_PARTITIONS", "4"))))
ML_PARTITION_STAGGER_SEC = max(0.0, float(os.getenv("ML_PARTITION_STAGGER_SEC", "0")))
DISABLE_ML_STATS_LOOP = os.getenv("DISABLE_ML_STATS_LOOP", "false").lower() == "true"


class PartitionRunConfig(BaseModel):
    video: str
    model: str = DEFAULT_MODEL
    resolution: str = DEFAULT_RESOLUTION


class RunRequest(BaseModel):
    partitions: Dict[int, PartitionRunConfig] = Field(default_factory=dict)


@dataclass
class PartitionRuntime:
    detector: subprocess.Popen
    video: str
    model: str
    resolution: str
    started_at: float


class ProcessManager:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._partition_runtime: Dict[int, PartitionRuntime] = {}
        self._signal_process: Optional[subprocess.Popen] = None
        self._stop_event = threading.Event()
        self._stats_thread: Optional[threading.Thread] = None
        self._batch_started_at: Optional[float] = None
        self._run_in_progress = False
        self._partition_errors: Dict[int, str] = {}

    def signal_simulation_running(self) -> bool:
        with self._lock:
            return bool(self._signal_process and self._signal_process.poll() is None)

    def ensure_signal_simulation(self, started_at: Optional[float] = None) -> None:
        with self._lock:
            running = self._signal_process and self._signal_process.poll() is None
            if running:
                return
            self._signal_process = subprocess.Popen(
                [sys.executable, str(SIMULATION_SCRIPT)],
                cwd=str(SIMULATION_SCRIPT.parent),
            )
            if started_at is not None:
                self._batch_started_at = started_at

    def _ensure_stats_loop(self) -> None:
        if self._stats_thread and self._stats_thread.is_alive():
            return
        self._stop_event.clear()
        self._stats_thread = threading.Thread(target=self._stats_loop, daemon=True)
        self._stats_thread.start()

    def _stats_loop(self) -> None:
        while not self._stop_event.is_set():
            snapshot = self._read_traffic_snapshot()
            if snapshot:
                publish_stats(snapshot)
            time.sleep(0.5)

    def _read_traffic_snapshot(self) -> Dict[str, Any]:
        """Full traffic.json (R1–R4 + simulation.py); FileLock matches partition scripts."""
        try:
            with FileLock(str(TRAFFIC_LOCK)):
                if not TRAFFIC_JSON.exists():
                    return {}
                data = json.loads(TRAFFIC_JSON.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                return {}
            out: Dict[str, Any] = dict(data)
            out["ts"] = int(time.time())
            return out
        except Exception:
            return {}

    def _log_detector_output(self, partition: int, process: subprocess.Popen) -> None:
        prefix = f"[partition {partition}]"
        try:
            if process.stdout:
                for line in process.stdout:
                    print(f"{prefix} {line.rstrip()}", flush=True)
        except Exception:
            pass
        code = process.wait()
        if code != 0:
            print(f"{prefix} exited with code {code}", flush=True)

    def _stop_process(self, process: subprocess.Popen) -> None:
        if process.poll() is not None:
            return
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()

    def stop_partition(self, partition: int) -> None:
        with self._lock:
            runtime = self._partition_runtime.pop(partition, None)
            if not runtime:
                return
            self._stop_process(runtime.detector)

    def _clear_partition_stream(self, partition: int) -> None:
        stream_dir = STREAMS_DIR / f"partition{partition}"
        if stream_dir.exists():
            shutil.rmtree(stream_dir)
        stream_dir.mkdir(parents=True, exist_ok=True)

    def run_partition(
        self,
        partition: int,
        cfg: PartitionRunConfig,
        started_at: Optional[float] = None,
    ) -> None:
        self.stop_partition(partition)
        self._clear_partition_stream(partition)

        script_name = SCRIPT_BY_PARTITION.get(partition)
        if not script_name:
            raise ValueError(f"Unsupported partition: {partition}")

        video_path = VIDEOS_DIR / cfg.video
        if not video_path.exists():
            raise ValueError(f"Video not found: {cfg.video}")

        model_path = MODELS_DIR / cfg.model
        if not model_path.exists():
            raise ValueError(f"Model not found: {cfg.model}")

        script_path = SCRIPTS_DIR / script_name
        if not script_path.exists():
            raise ValueError(f"Script not found: {script_name}")

        batch_ts = started_at if started_at is not None else self._batch_started_at
        launch_ts = batch_ts if batch_ts is not None else time.time()
        stream_dir = STREAMS_DIR / f"partition{partition}"

        detector = subprocess.Popen(
            [
                sys.executable,
                "-u",
                str(script_path),
                f"--partition={partition}",
                f"--model={model_path}",
                f"--source={video_path}",
                f"--resolution={cfg.resolution}",
                f"--hls-dir={STREAMS_DIR / f'partition{partition}'}",
            ],
            cwd=str(SCRIPTS_DIR),
            stderr=subprocess.STDOUT,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        threading.Thread(
            target=self._log_detector_output,
            args=(partition, detector),
            daemon=True,
        ).start()

        with self._lock:
            self._partition_errors.pop(partition, None)
            self._partition_runtime[partition] = PartitionRuntime(
                detector=detector,
                video=cfg.video,
                model=cfg.model,
                resolution=cfg.resolution,
                started_at=launch_ts,
            )
        if not DISABLE_ML_STATS_LOOP:
            self._ensure_stats_loop()

        # Detect fast crashes (bad model, OOM, missing deps) before callers poll status.
        time.sleep(0.75)
        if detector.poll() is not None:
            code = detector.returncode
            with self._lock:
                self._partition_runtime.pop(partition, None)
                self._partition_errors[partition] = f"partition process exited immediately (code {code})"
            self._clear_partition_stream(partition)
            raise RuntimeError(self._partition_errors[partition])

    def running_partition_count(self) -> int:
        with self._lock:
            return sum(
                1
                for rt in self._partition_runtime.values()
                if rt.detector.poll() is None
            )

    def status(self) -> Dict[str, object]:
        payload: Dict[int, Dict[str, object]] = {}
        with self._lock:
            for partition in range(1, 5):
                runtime = self._partition_runtime.get(partition)
                if not runtime:
                    err = self._partition_errors.get(partition)
                    payload[partition] = (
                        {"running": False, "error": err} if err else {"running": False}
                    )
                    continue
                running = runtime.detector.poll() is None
                part_status: Dict[str, object] = {
                    "running": running,
                    "video": runtime.video,
                    "model": runtime.model,
                    "resolution": runtime.resolution,
                    "startedAt": runtime.started_at,
                }
                if running:
                    part_status["streamPath"] = f"/streams/partition{partition}/index.m3u8"
                elif partition in self._partition_errors:
                    part_status["error"] = self._partition_errors[partition]
                payload[partition] = part_status

        return {
            "partitions": payload,
            "signalSimulationRunning": self.signal_simulation_running(),
            "batchStartedAt": self._batch_started_at,
            "starting": self._run_in_progress,
        }

    def pause_partition(self, partition: int) -> None:
        """Pause a partition by sending SIGSTOP to its process."""
        with self._lock:
            runtime = self._partition_runtime.get(partition)
            if not runtime or runtime.detector.poll() is not None:
                return
            try:
                import signal
                os.kill(runtime.detector.pid, signal.SIGSTOP)
            except Exception:
                pass

    def resume_partition(self, partition: int) -> None:
        """Resume a partition by sending SIGCONT to its process."""
        with self._lock:
            runtime = self._partition_runtime.get(partition)
            if not runtime or runtime.detector.poll() is not None:
                return
            try:
                import signal
                os.kill(runtime.detector.pid, signal.SIGCONT)
            except Exception:
                pass

    def pause_all(self) -> None:
        """Pause all running partitions."""
        for partition in [1, 2, 3, 4]:
            self.pause_partition(partition)
        with self._lock:
            if self._signal_process and self._signal_process.poll() is None:
                try:
                    import signal
                    os.kill(self._signal_process.pid, signal.SIGSTOP)
                except Exception:
                    pass

    def resume_all(self) -> None:
        """Resume all paused partitions."""
        for partition in [1, 2, 3, 4]:
            self.resume_partition(partition)
        with self._lock:
            if self._signal_process and self._signal_process.poll() is None:
                try:
                    import signal
                    os.kill(self._signal_process.pid, signal.SIGCONT)
                except Exception:
                    pass

    def stop_all(self) -> None:
        for partition in [1, 2, 3, 4]:
            self.stop_partition(partition)
        with self._lock:
            if self._signal_process:
                self._stop_process(self._signal_process)
                self._signal_process = None
            self._batch_started_at = None
            self._run_in_progress = False
            self._partition_errors.clear()
        self._stop_event.set()

    def start_simulation_batch(self, req: RunRequest) -> float:
        """Start traffic signal simulation and all partitions together (non-blocking caller)."""
        batch_started_at = time.time()
        with self._lock:
            self._batch_started_at = batch_started_at
            self._run_in_progress = True
            self._partition_errors.clear()

        for partition in range(1, 5):
            self._clear_partition_stream(partition)

        self.ensure_signal_simulation(started_at=batch_started_at)

        items = sorted(req.partitions.items(), key=lambda x: x[0])

        def _start_all_partitions() -> None:
            for idx, (partition, cfg) in enumerate(items):
                while True:
                    if self.running_partition_count() < ML_MAX_PARTITIONS:
                        break
                    time.sleep(0.1)
                try:
                    self.run_partition(partition, cfg, started_at=batch_started_at)
                except Exception as exc:
                    msg = str(exc)
                    with self._lock:
                        self._partition_errors[partition] = msg
                    print(f"[partition {partition}] failed to start: {msg}", flush=True)
                if idx < len(items) - 1 and ML_PARTITION_STAGGER_SEC > 0:
                    time.sleep(ML_PARTITION_STAGGER_SEC)
            with self._lock:
                self._run_in_progress = False

        threading.Thread(
            target=_start_all_partitions,
            daemon=True,
            name="simulation-batch-start",
        ).start()
        return batch_started_at


manager = ProcessManager()
app = FastAPI(title="Smart Traffic ML Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
STREAMS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/streams", StaticFiles(directory=str(STREAMS_DIR)), name="streams")
app.mount("/video-files", StaticFiles(directory=str(VIDEOS_DIR)), name="video-files")

redis_client = redis.from_url(REDIS_URL, decode_responses=True) if (redis and REDIS_URL) else None


def publish_stats(stats: Dict[str, Any]) -> None:
    if not redis_client:
        return

    async def _publish() -> None:
        await redis_client.set("simulation:latest_stats", json.dumps(stats))
        await redis_client.publish(STATS_CHANNEL, json.dumps(stats))

    try:
        asyncio.run(_publish())
    except RuntimeError:
        pass


def _normalize_status_response(raw: Dict[str, object]) -> Dict[str, object]:
    """Support legacy flat partition map and new nested status shape."""
    if "partitions" in raw:
        return raw
    return {
        "partitions": raw,
        "signalSimulationRunning": manager.signal_simulation_running(),
        "batchStartedAt": manager._batch_started_at,
        "starting": manager._run_in_progress,
    }


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/videos")
def videos() -> Dict[str, list]:
    all_videos = sorted([p.name for p in VIDEOS_DIR.glob("*") if p.suffix.lower() in {".mp4", ".mov", ".mkv", ".avi"}])
    return {"videos": all_videos}


@app.post("/simulation/run")
def run_simulation(req: RunRequest) -> Dict[str, object]:
    batch_started_at = manager.start_simulation_batch(req)
    status = manager.status()
    return {
        "ok": True,
        "starting": True,
        "batchStartedAt": batch_started_at,
        "status": status["partitions"],
        "signalSimulationRunning": status["signalSimulationRunning"],
    }


@app.post("/simulation/stop")
def stop_simulation() -> Dict[str, bool]:
    manager.stop_all()
    return {"ok": True}


@app.post("/simulation/pause")
def pause_simulation() -> Dict[str, object]:
    manager.pause_all()
    status = manager.status()
    return {"ok": True, "status": status["partitions"]}


@app.post("/simulation/resume")
def resume_simulation() -> Dict[str, object]:
    manager.resume_all()
    status = manager.status()
    return {"ok": True, "status": status["partitions"]}


@app.get("/simulation/status")
def simulation_status() -> Dict[str, object]:
    status = manager.status()
    return {
        "status": status["partitions"],
        "signalSimulationRunning": status["signalSimulationRunning"],
        "batchStartedAt": status["batchStartedAt"],
        "starting": status["starting"],
    }


@app.websocket("/ws/analytics")
async def analytics_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    pubsub = None
    try:
        if redis_client:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(STATS_CHANNEL)
        while True:
            if pubsub:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("data"):
                    await websocket.send_text(str(message["data"]))
                    continue
            stats = manager._read_traffic_snapshot()
            if stats:
                await websocket.send_text(json.dumps(stats))
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if pubsub:
            try:
                await pubsub.unsubscribe(STATS_CHANNEL)
            except Exception:
                pass
            try:
                await pubsub.aclose()
            except Exception:
                pass
