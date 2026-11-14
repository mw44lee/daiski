"""Find speech segments in a 16-bit PCM WAV by silence detection (stdlib only).

Usage: python -I tools/split_silence.py file.wav [min_gap_sec=0.45] [threshold_ratio=0.04]
Prints one "start end" (seconds) per detected segment.
"""
import array
import sys
import wave

path = sys.argv[1]
min_gap = float(sys.argv[2]) if len(sys.argv) > 2 else 0.45
ratio = float(sys.argv[3]) if len(sys.argv) > 3 else 0.04

w = wave.open(path)
assert w.getsampwidth() == 2
ch, rate, n = w.getnchannels(), w.getframerate(), w.getnframes()
data = array.array('h', w.readframes(n))
if ch > 1:
    data = data[::ch]
hop = int(rate * 0.02)
peaks = []
for i in range(0, len(data), hop):
    blk = data[i:i + hop]
    if blk:
        peaks.append(max(max(blk), -min(blk)))
top = sorted(peaks)[int(len(peaks) * 0.98)]
thr = top * ratio
voiced = [p > thr for p in peaks]

segs = []
start = None
silence = 0
gap_frames = int(min_gap / 0.02)
for i, v in enumerate(voiced):
    if v:
        if start is None:
            start = i
        silence = 0
    elif start is not None:
        silence += 1
        if silence >= gap_frames:
            segs.append((start, i - silence + 1))
            start, silence = None, 0
if start is not None:
    segs.append((start, len(voiced)))
segs = [(a, b) for a, b in segs if (b - a) * 0.02 >= 0.3]
for a, b in segs:
    print(f'{max(0, a * 0.02 - 0.12):.2f} {b * 0.02 + 0.15:.2f}  ({(b - a) * 0.02:.2f}s)')
print(len(segs), 'segments', file=sys.stderr)
