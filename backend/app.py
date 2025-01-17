from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr
from transformers import pipeline
from googletrans import Translator
import numpy as np
import soundfile as sf
import noisereduce as nr
import tempfile
from pydub import AudioSegment
import io
import os

app = Flask(_name_)
CORS(app)

# Initialize models
recognizer = sr.Recognizer()
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=False)
translator = Translator()

def convert_audio_to_wav(audio_file):
    try:
        audio = AudioSegment.from_file(audio_file)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            audio.export(temp_file.name, format="wav")
            return temp_file.name
    except Exception as e:
        raise ValueError(f"Error converting audio to WAV: {e}")

def process_audio_file(audio_path):
    try:
        audio_data, sample_rate = sf.read(audio_path)
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)
        cleaned_audio = nr.reduce_noise(y=audio_data, sr=sample_rate)
        return cleaned_audio, sample_rate
    except Exception as e:
        raise ValueError(f"Error processing audio file: {e}")

def transcribe_audio(audio_data, sample_rate):
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            sf.write(temp_file.name, audio_data, sample_rate)
            temp_file.close()  # Ensure the file is closed before reading it
            with sr.AudioFile(temp_file.name) as source:
                audio = recognizer.record(source)
                try:
                    transcription = recognizer.recognize_google(audio)
                    return transcription
                except sr.UnknownValueError:
                    raise ValueError("Unable to understand audio")
                except sr.RequestError:
                    raise Exception("Google Speech Recognition API error")
    except Exception as e:
        raise ValueError(f"Error transcribing audio: {e}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

def analyze_emotion(text):
    """Analyze emotion from text."""
    try:
        results = emotion_model(text)
        emotion = max(results, key=lambda x: x['score'])['label']
        return emotion
    except Exception as e:
        raise ValueError(f"Error analyzing emotion: {e}")

@app.route("/process-speech", methods=["POST"])
def process_speech():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        target_language = request.form.get("target_language", "en")

        # Convert audio to WAV format
        wav_file_path = convert_audio_to_wav(audio_file)

        # Process audio file
        cleaned_audio, sample_rate = process_audio_file(wav_file_path)

        # Clean up the WAV file after processing
        if os.path.exists(wav_file_path):
            os.remove(wav_file_path)

        # Transcribe audio
        original_text = transcribe_audio(cleaned_audio, sample_rate)

        # Analyze emotion
        emotion = analyze_emotion(original_text)

        # Translate text
        translated_text = translator.translate(original_text, dest=target_language).text

        # Save cleaned audio to bytes
        audio_bytes = io.BytesIO()
        sf.write(audio_bytes, cleaned_audio, sample_rate, format='WAV')

        return jsonify({
            "original_text": original_text,
            "translated_text": translated_text,
            "emotion": emotion,
            "clean_audio": list(audio_bytes.getvalue())
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if _name_ == "_main_":
    app.run(debug=True, port=5001)


