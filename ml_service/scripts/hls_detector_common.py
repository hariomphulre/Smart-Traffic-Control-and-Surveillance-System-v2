"""
Headless YOLO partition runner + HLS output.
Streams the current video frame at a steady FPS; overlays the latest detections
when inference completes (never substitutes a stale full frame).
"""

import argparse
import json
import shutil
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from filelock import FileLock
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parents[1]
TRAFFIC_JSON = ROOT_DIR / "traffic_signal_simulation" / "traffic.json"
TRAFFIC_TMP = Path(str(TRAFFIC_JSON) + ".tmp")
TRAFFIC_LOCK = Path(str(TRAFFIC_JSON) + ".lock")

CONF_THRESHOLD = 0.5
VEHICLE_CLASSES = frozenset({"car", "bike", "bus", "truck"})
OUTPUT_FPS = 15
INFER_EVERY_N_FRAMES = 3
TRAFFIC_WRITE_INTERVAL_SEC = 0.5


@dataclass
class DetectionBox:
    x1: int
    y1: int
    x2: int
    y2: int
    classname: str
    conf: float
    track_id: int


@dataclass
class OverlayState:
    boxes: list[DetectionBox] = field(default_factory=list)
    object_count: int = 0


def _log(msg: str) -> None:
    print(msg, flush=True)


def parse_resolution(value: str) -> tuple[int, int]:
    parts = value.lower().split("x")
    if len(parts) != 2:
        raise ValueError("resolution must be in WIDTHxHEIGHT format")
    return int(parts[0]), int(parts[1])


def update_partition_traffic_r1_style(partition: int, object_count: int) -> None:
    file_path = str(TRAFFIC_JSON)
    temp_path = str(TRAFFIC_TMP)
    lock_path = str(TRAFFIC_LOCK)

    with FileLock(lock_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                traffic_vol_dict = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            traffic_vol_dict = {}

        traffic_vol_dict[f"T{partition}"] = int(object_count)

        try:
            with open(temp_path, "w", encoding="utf-8") as temp_file:
                json.dump(traffic_vol_dict, temp_file, indent=4)
            shutil.move(temp_path, file_path)
        except Exception:
            if Path(temp_path).exists():
                Path(temp_path).unlink(missing_ok=True)  # type: ignore[arg-type]
            raise


def _start_ffmpeg(hls_index: Path, width: int, height: int) -> subprocess.Popen:
    return subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "bgr24",
            "-s",
            f"{width}x{height}",
            "-r",
            str(OUTPUT_FPS),
            "-i",
            "-",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-tune",
            "zerolatency",
            "-g",
            str(OUTPUT_FPS),
            "-keyint_min",
            str(OUTPUT_FPS),
            "-sc_threshold",
            "0",
            "-hls_time",
            "0.5",
            "-hls_init_time",
            "0.5",
            "-hls_list_size",
            "8",
            "-hls_flags",
            "delete_segments+append_list+omit_endlist",
            str(hls_index),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=sys.stderr,
    )


def _load_model_async(model_path: str, holder: list, err: list) -> None:
    try:
        _log(f"Loading YOLO model: {model_path}")
        holder.append(YOLO(model_path, task="detect"))
        _log("YOLO model ready")
    except Exception as exc:
        err.append(exc)
        _log(f"YOLO load failed: {exc}")


def _run_inference(model: Any, frame: np.ndarray, labels: dict) -> OverlayState:
    """Detect vehicles on a single frame; returns overlay metadata (not a cached frame)."""
    results = model(frame, verbose=False)
    boxes = results[0].boxes
    overlay = OverlayState()

    if boxes is None or len(boxes) == 0:
        return overlay

    track_ids = None
    if boxes.id is not None:
        track_ids = boxes.id.int().cpu().tolist()

    for i in range(len(boxes)):
        classidx = int(boxes[i].cls.item())
        classname = labels[classidx]
        conf = float(boxes[i].conf.item())
        if conf <= CONF_THRESHOLD:
            continue
        if classname in VEHICLE_CLASSES:
            overlay.object_count += 1

        xyxy = boxes[i].xyxy[0].int().tolist()
        tid = int(track_ids[i]) if track_ids is not None else i
        overlay.boxes.append(
            DetectionBox(
                x1=xyxy[0],
                y1=xyxy[1],
                x2=xyxy[2],
                y2=xyxy[3],
                classname=classname,
                conf=conf,
                track_id=tid,
            )
        )

    return overlay


def _draw_overlay(frame: np.ndarray, overlay: OverlayState, partition: int) -> np.ndarray:
    """Draw the latest detection overlay onto the current video frame."""
    out = frame.copy()
    for det in overlay.boxes:
        cv2.rectangle(out, (det.x1, det.y1), (det.x2, det.y2), (0, 255, 0), 2)
        label = f"ID: {det.track_id}, {det.classname}: {int(det.conf * 100)}%"
        cv2.putText(
            out,
            label,
            (det.x1, max(20, det.y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            2,
        )

    cv2.putText(
        out,
        f"P{partition} vehicles (T{partition}): {overlay.object_count}",
        (12, 28),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 0),
        2,
    )
    return out


def run_partition() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--partition", type=int, required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--resolution", default="500x300")
    parser.add_argument("--hls-dir", required=True)
    args = parser.parse_args()

    width, height = parse_resolution(args.resolution)
    partition = args.partition
    hls_dir = Path(args.hls_dir)
    hls_dir.mkdir(parents=True, exist_ok=True)
    hls_index = hls_dir / "index.m3u8"

    _log(f"Partition {partition}: opening {args.source}")
    cap = cv2.VideoCapture(args.source)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open source: {args.source}")

    ffmpeg = _start_ffmpeg(hls_index, width, height)
    _log(f"Partition {partition}: FFmpeg HLS -> {hls_index}")

    model_holder: list = []
    model_err: list = []
    threading.Thread(
        target=_load_model_async,
        args=(args.model, model_holder, model_err),
        daemon=True,
    ).start()

    frame_interval = 1.0 / OUTPUT_FPS
    frame_idx = 0
    overlay_lock = threading.Lock()
    latest_overlay: dict[str, OverlayState | None] = {"state": None}
    infer_busy = {"flag": False}
    last_traffic_write = 0.0
    pending_traffic_count: dict[str, int | None] = {"value": None}
    executor = ThreadPoolExecutor(max_workers=1)

    def _maybe_flush_traffic() -> None:
        nonlocal last_traffic_write
        pending = pending_traffic_count["value"]
        if pending is None:
            return
        now = time.monotonic()
        if now - last_traffic_write < TRAFFIC_WRITE_INTERVAL_SEC:
            return
        update_partition_traffic_r1_style(partition, pending)
        pending_traffic_count["value"] = None
        last_traffic_write = now

    def _run_inference_async(frame_copy: np.ndarray) -> None:
        try:
            model = model_holder[0]
            overlay = _run_inference(model, frame_copy, model.names)
            with overlay_lock:
                latest_overlay["state"] = overlay
            pending_traffic_count["value"] = overlay.object_count
        finally:
            infer_busy["flag"] = False

    try:
        while True:
            loop_start = time.perf_counter()
            if ffmpeg.poll() is not None:
                _log(f"Partition {partition}: ffmpeg exited ({ffmpeg.returncode})")
                break

            ok, frame = cap.read()
            if not ok:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                time.sleep(0.02)
                continue

            frame = cv2.resize(frame, (width, height))
            frame_idx += 1

            if model_err:
                out = frame.copy()
                cv2.putText(
                    out,
                    "ML model failed to load",
                    (12, 28),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 255),
                    2,
                )
            elif not model_holder:
                out = frame.copy()
                cv2.putText(
                    out,
                    "Loading ML model...",
                    (12, 28),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 0),
                    2,
                )
            else:
                with overlay_lock:
                    overlay = latest_overlay["state"]
                if overlay is not None:
                    out = _draw_overlay(frame, overlay, partition)
                else:
                    out = frame.copy()

                if not infer_busy["flag"] and frame_idx % INFER_EVERY_N_FRAMES == 0:
                    infer_busy["flag"] = True
                    executor.submit(_run_inference_async, frame.copy())

            _maybe_flush_traffic()

            if ffmpeg.stdin:
                try:
                    ffmpeg.stdin.write(out.tobytes())
                except BrokenPipeError:
                    _log(f"Partition {partition}: ffmpeg stdin closed")
                    break

            elapsed = time.perf_counter() - loop_start
            sleep_for = frame_interval - elapsed
            if sleep_for > 0:
                time.sleep(sleep_for)
    finally:
        if pending_traffic_count["value"] is not None:
            try:
                update_partition_traffic_r1_style(partition, pending_traffic_count["value"])
            except Exception:
                pass
        executor.shutdown(wait=False, cancel_futures=True)
        cap.release()
        if ffmpeg.stdin:
            try:
                ffmpeg.stdin.close()
            except Exception:
                pass
        ffmpeg.terminate()
        _log(f"Partition {partition}: stopped")


if __name__ == "__main__":
    run_partition()
