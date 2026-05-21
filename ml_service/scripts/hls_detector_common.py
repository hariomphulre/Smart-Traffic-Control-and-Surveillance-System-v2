"""
Headless YOLO partition runner + HLS output.
Streams video to FFmpeg immediately while YOLO loads in the background (avoids 404 on index.m3u8).
"""

import argparse
import json
import shutil
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
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
OUTPUT_FPS = 12
INFER_EVERY_N_FRAMES = 2


def _log(msg: str) -> None:
    print(msg, flush=True)


def _infer_frame(model: Any, frame: Any) -> Any:
    try:
        return model.track(frame, persist=True, verbose=False)
    except Exception:
        return model(frame, verbose=False)


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
            "1",
            "-hls_init_time",
            "1",
            "-hls_list_size",
            "6",
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


def _annotate_frame(
    frame: Any,
    model: Any,
    labels: dict,
    partition: int,
    frame_idx: int,
) -> tuple[Any, int]:
    if frame_idx % INFER_EVERY_N_FRAMES != 0:
        return frame, 0

    results = _infer_frame(model, frame)
    boxes = results[0].boxes
    object_count = 0

    if boxes is None or len(boxes) == 0:
        update_partition_traffic_r1_style(partition, 0)
        return frame, 0

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
            object_count += 1

        xyxy = boxes[i].xyxy[0].int().tolist()
        x1, y1, x2, y2 = xyxy[0], xyxy[1], xyxy[2], xyxy[3]
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        tid = int(track_ids[i]) if track_ids is not None else i
        label = f"ID: {tid}, {classname}: {int(conf * 100)}%"
        cv2.putText(
            frame,
            label,
            (x1, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            2,
        )

    cv2.putText(
        frame,
        f"P{partition} vehicles (T{partition}): {object_count}",
        (12, 28),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 0),
        2,
    )
    update_partition_traffic_r1_style(partition, object_count)
    return frame, object_count


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
    display_lock = threading.Lock()
    latest_display: dict[str, Any] = {"frame": None}
    infer_busy = {"flag": False}
    executor = ThreadPoolExecutor(max_workers=1)

    def _run_inference(frame_copy: np.ndarray, idx: int) -> None:
        try:
            model = model_holder[0]
            annotated, _ = _annotate_frame(frame_copy, model, model.names, partition, idx)
            with display_lock:
                latest_display["frame"] = annotated
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
                time.sleep(0.03)
                continue

            frame = cv2.resize(frame, (width, height))
            frame_idx += 1
            out = frame.copy()

            if model_err:
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
                with display_lock:
                    cached = latest_display["frame"]
                if cached is not None:
                    out = cached.copy()
                if not infer_busy["flag"] and frame_idx % INFER_EVERY_N_FRAMES == 0:
                    infer_busy["flag"] = True
                    executor.submit(_run_inference, frame.copy(), frame_idx)

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
