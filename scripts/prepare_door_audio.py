"""Prepare Oiboo's CC0 Door Open SFX without changing its pitch or playback speed.

Usage: python scripts/prepare_door_audio.py source.wav audio/se/door_open.wav
Source: https://opengameart.org/content/door-open-sfx
"""
import array
import math
import sys
import wave
from pathlib import Path


def prepare(source, destination):
    with wave.open(str(source), "rb") as audio:
        if audio.getsampwidth() != 2 or audio.getcomptype() != "NONE":
            raise ValueError("Expected uncompressed 16-bit PCM WAV")
        rate, channels = audio.getframerate(), audio.getnchannels()
        samples = array.array("h", audio.readframes(audio.getnframes()))
    if sys.byteorder != "little":
        samples.byteswap()
    mono = [sum(samples[i:i + channels]) / channels for i in range(0, len(samples), channels)]
    peak = max(map(abs, mono), default=0)
    if not peak:
        raise ValueError("Source contains no sound")
    audible = [i for i, sample in enumerate(mono) if abs(sample) >= peak * 0.01]
    start = max(0, audible[0] - int(rate * 0.01))
    end = min(len(mono), audible[-1] + int(rate * 0.05) + 1)
    mono = mono[start:end]
    scale = (32767 * 10 ** (-9 / 20)) / max(map(abs, mono))
    attack, release = max(1, int(rate * 0.008)), max(1, int(rate * 0.04))
    output = array.array("h", (
        round(sample * scale * min(1, i / attack, (len(mono) - 1 - i) / release))
        for i, sample in enumerate(mono)
    ))
    output_peak = max(map(abs, output)) / 32768
    if sys.byteorder != "little":
        output.byteswap()
    with wave.open(str(destination), "wb") as audio:
        audio.setparams((1, 2, rate, len(output), "NONE", "not compressed"))
        audio.writeframes(output.tobytes())
    print(f"{destination}: {len(output) / rate:.3f}s, mono PCM16/{rate}Hz, peak {20 * math.log10(output_peak):.2f}dBFS")


if __name__ == "__main__":
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))
