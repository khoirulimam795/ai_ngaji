# aligner.py - VERSI FIX
import whisperx
import torch
import numpy as np
import os

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
COMPUTE_TYPE = "float16" if DEVICE == "cuda" else "int8"

# Cari model lokal dulu
CACHE_DIR = os.path.expanduser("~/.cache/huggingface/hub")
MODEL = whisperx.load_model("medium", device=DEVICE, compute_type=COMPUTE_TYPE, download_root=CACHE_DIR)

def align_recitation(audio_path: str) -> dict:
    audio = whisperx.load_audio(audio_path)
    # Transcribe
    result = MODEL.transcribe(audio, batch_size=4, language="ar")
    # Align word-level
    align_model, align_metadata = whisperx.load_align_model(language_code="ar", device=DEVICE)
    aligned = whisperx.align(
        result["segments"], align_model, align_metadata, audio, DEVICE
    )
    return aligned