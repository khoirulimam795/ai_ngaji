import sounddevice as sd
import soundfile as sf
import numpy as np

def record_audio(output_path, samplerate=16000):

    print("\n🎙️ Tekan ENTER untuk mulai rekam...")
    input()

    print("🔴 Recording... tekan ENTER untuk berhenti.\n")

    recording = []

    def callback(indata, frames, time, status):

        if status:
            print(status)

        recording.append(indata.copy())

        volume = np.linalg.norm(indata) * 10

        bars = "█" * min(int(volume), 50)

        print(f"\r🎤 {bars}", end="")

    stream = sd.InputStream(
        samplerate=samplerate,
        channels=1,
        callback=callback
    )

    stream.start()

    input()

    stream.stop()
    stream.close()

    audio = np.concatenate(recording, axis=0)

    sf.write(output_path, audio, samplerate)

    print(f"\n\n✅ Audio tersimpan: {output_path}")