# AI Speech Translator with Noise Reduction

An innovative web application that integrates speech recognition, emotion detection, and text translation with advanced noise reduction for audio processing.

## Features

- **Noise Reduction**: Removes background noise from audio recordings.
- **Speech Recognition**: Converts audio into text.
- **Emotion Analysis**: Detects emotions from transcribed text.
- **Text Translation**: Translates text into multiple languages.
- **User-Friendly Interface**: Simple and intuitive UI built with React.js.

## Technologies Used

### Backend:
- **Flask**: For building APIs.
- **SpeechRecognition**: For speech-to-text conversion.
- **Transformers (Hugging Face)**: For emotion detection.
- **Googletrans**: For text translation.
- **Pydub, Noisereduce**: For audio processing.

### Frontend:
- **React.js**: For creating the web interface.

## Installation and Setup

### Prerequisites
- Python 3.7+
- Node.js and npm
- Virtual environment tools like `venv` or `conda`

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-speech-translator.git
   cd ai-speech-translator/backend
