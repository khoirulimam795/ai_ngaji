# src/audio_processor.py
import librosa
import numpy as np
from pathlib import Path
from pydub import AudioSegment

def convert_to_wav(input_path: str, output_path: str = None) -> str:
    """Konversi MP3/M4A/FLAC → WAV 16kHz mono"""
    input_p = Path(input_path)
    
    if output_path is None:
        output_path = input_p.with_suffix(".wav")
    
    # Kalau sudah WAV, langsung return
    if input_p.suffix.lower() == ".wav":
        return str(input_path)
    
    print(f"🔄 Konversi {input_p.suffix} → WAV...")
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
    audio.export(output_path, format="wav")
    print(f"✅ Tersimpan: {output_path}")
    return str(output_path)

def load_audio(path: str, target_sr: int = 16000) -> np.ndarray:
    """Load audio + auto convert jika bukan WAV"""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"❌ Audio tidak ditemukan: {p}")
    
    # Auto convert jika perlu
    if p.suffix.lower() != ".wav":
        path = convert_to_wav(path)
    
    y, sr = librosa.load(path, sr=target_sr, mono=True)
    return y