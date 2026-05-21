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

DEFAULT_MODEL = os.getenv("ML_DEFAULT_MODEL", "new_car4_with_helmet.pt")
DEFAULT_RESOLUTION = os.getenv("ML_DEFAULT_RESOLUTION", "500x300")
REDIS_URL = os.getenv("REDIS_URL", "")
STATS_CHANNEL = "simulation:stats"
ML_MAX_PARTITIONS = max(1, int(os.getenv("ML_MAX_PARTITIONS", "2")))
ML_PARTITION_STAGGER_SEC = float(os.getenv("ML_PARTITION_STAGGER_SEC", "6"))
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

    def ensure_signal_simulation(self) -> None:
        with self._lock:
            running = self._signal_process and self._signal_process.poll() is None
            if running:
                return
            self._signal_process = subprocess.Popen(
                [sys.executable, str(SIMULATION_SCRIPT)],
                cwd=str(SIMULATION_SCRIPT.parent),
            )

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

    def run_partition(self, partition: int, cfg: PartitionRunConfig) -> None:
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

        self.stop_partition(partition)
        stream_dir = STREAMS_DIR / f"partition{partition}"
        if stream_dir.exists():
            shutil.rmtree(stream_dir)
        stream_dir.mkdir(parents=True, exist_ok=True)
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
            self._partition_runtime[partition] = PartitionRuntime(
                detector=detector,
                video=cfg.video,
                model=cfg.model,
                resolution=cfg.resolution,
                started_at=time.time(),
            )
        if not DISABLE_ML_STATS_LOOP:
            self._ensure_stats_loop()

    def running_partition_count(self) -> int:
        with self._lock:
            return sum(
                1
                for rt in self._partition_runtime.values()
                if rt.detector.poll() is None
            )

    def status(self) -> Dict[int, Dict[str, object]]:
        payload: Dict[int, Dict[str, object]] = {}
        with self._lock:
            for partition in range(1, 5):
                runtime = self._partition_runtime.get(partition)
                if not runtime:
                    payload[partition] = {"running": False}
                    continue
                payload[partition] = {
                    "running": runtime.detector.poll() is None,
                    "video": runtime.video,
                    "model": runtime.model,
                    "resolution": runtime.resolution,
                    "streamPath": f"/streams/partition{partition}/index.m3u8",
                    "startedAt": runtime.started_at,
                }
        return payload

    def stop_all(self) -> None:
        for partition in [1, 2, 3, 4]:
            self.stop_partition(partition)
        with self._lock:
            if self._signal_process:
                self._stop_process(self._signal_process)
                self._signal_process = None
        self._stop_event.set()


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


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/videos")
def videos() -> Dict[str, list]:
    all_videos = sorted([p.name for p in VIDEOS_DIR.glob("*") if p.suffix.lower() in {".mp4", ".mov", ".mkv", ".avi"}])
    return {"videos": all_videos}


@app.post("/simulation/run")
def run_simulation(req: RunRequest) -> Dict[str, object]:
    manager.ensure_signal_simulation()
    items = sorted(req.partitions.items(), key=lambda x: x[0])
    for partition, cfg in items:
        while manager.running_partition_count() >= ML_MAX_PARTITIONS:
            time.sleep(2)
        manager.run_partition(partition, cfg)
        time.sleep(ML_PARTITION_STAGGER_SEC)
    return {"ok": True, "status": manager.status()}


@app.post("/simulation/stop")
def stop_simulation() -> Dict[str, bool]:
    manager.stop_all()
    return {"ok": True}


@app.get("/simulation/status")
def simulation_status() -> Dict[str, object]:
    return {"status": manager.status()}


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

