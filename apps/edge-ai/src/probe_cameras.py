"""List webcam indices that OpenCV can actually open on this machine.

Run from the repo root:
    uv run --directory apps/edge-ai python src/probe_cameras.py

Prints each index with its frame size. Use a working index as `source=<n>` for `npm run cam`.
"""

import cv2


def main() -> None:
    print("Probing camera indices 0..9...")
    found = []
    for index in range(10):
        cap = cv2.VideoCapture(index, cv2.CAP_MSMF)
        ok, frame = cap.read()
        if ok and frame is not None:
            h, w = frame.shape[:2]
            print(f"  [OK]  index={index}  {w}x{h}")
            found.append(index)
        cap.release()
    if not found:
        print("  No readable camera found. Close other apps using the webcam and retry.")
    else:
        print(f"Usable indices: {found}. Use: source={found[0]}")


if __name__ == "__main__":
    main()