import librosa

def extract_audio_segment(
    audio,
    sr,
    start,
    end
):

    start_sample = int(start * sr)
    end_sample = int(end * sr)

    return audio[start_sample:end_sample]