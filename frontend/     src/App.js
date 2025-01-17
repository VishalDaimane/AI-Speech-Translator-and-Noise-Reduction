import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [state, setState] = useState({
    originalText: '',
    translatedText: '',
    emotion: '',
    language: 'en',
    isRecording: false,
    error: null,
    audioUrl: null,
    cleanAudioUrl: null,
    isProcessing: false
  });

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const processAudio = async (audioData) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const formData = new FormData();
      formData.append('audio', new Blob([audioData], { type: 'audio/wav' }));
      formData.append('target_language', state.language);

      const response = await fetch('http://localhost:5001/process-speech', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process audio');
      }

      const data = await response.json();

      if (data.clean_audio) {
        const cleanAudioBlob = new Blob(
          [new Uint8Array(data.clean_audio).buffer],
          { type: 'audio/wav' }
        );

        setState(prev => ({
          ...prev,
          originalText: data.original_text,
          translatedText: data.translated_text,
          emotion: data.emotion,
          cleanAudioUrl: URL.createObjectURL(cleanAudioBlob),
          error: null,
          isProcessing: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to process audio',
        isProcessing: false
      }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setState(prev => ({ ...prev, audioUrl }));

        const reader = new FileReader();
        reader.onloadend = async () => {
          const arrayBuffer = reader.result;
          await processAudio(arrayBuffer);
        };
        reader.readAsArrayBuffer(audioBlob);
      };

      mediaRecorder.current.start();
      setState(prev => ({ ...prev, isRecording: true, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Microphone access denied'
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AI Speech Translator</h1>
      </header>

      <main className="main-content">
        <button
          className={record-button ${state.isRecording ? 'recording' : ''}}
          onClick={state.isRecording ? stopRecording : startRecording}
          disabled={state.isProcessing}
        >
          {state.isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <div className="language-selector">
          <label>Target Language:</label>
          <select
            value={state.language}
            onChange={(e) => setState(prev => ({ ...prev, language: e.target.value }))}
            disabled={state.isRecording || state.isProcessing}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="kn">Kannada</option>
          </select>
        </div>

        {state.error && <div className="error-message">{state.error}</div>}
        {state.isProcessing && <div className="processing-message">Processing audio...</div>}

        <div className="audio-preview">
          {state.audioUrl && (
            <div className="audio-player">
              <h3>Original Audio:</h3>
              <audio controls src={state.audioUrl} />
            </div>
          )}
          {state.cleanAudioUrl && (
            <div className="audio-player">
              <h3>Cleaned Audio:</h3>
              <audio controls src={state.cleanAudioUrl} />
            </div>
          )}
        </div>

        <div className="results">
          <h2>Results</h2>
          <div className="result-item">
            <strong>Original Text:</strong>
            <p>{state.originalText || 'No input yet'}</p>
          </div>
          <div className="result-item">
            <strong>Translated Text:</strong>
            <p>{state.translatedText || 'No translation yet'}</p>
          </div>
          <div className="result-item">
            <strong>Emotion:</strong>
            <div className={emotion-tag ${state.emotion.toLowerCase()}}>
              {state.emotion || 'No emotion detected'}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        Made with ❤ by You
      </footer>
    </div>
  );
}

export default App;


