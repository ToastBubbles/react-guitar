import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [volume, setVolume] = useState(50); // Initial volume set to 50%
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new window.AudioContext();
        const gainNode = audioContext.createGain();
        
        gainNode.gain.value = volume / 100; // Set initial volume

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
          },
        });

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(gainNode); // Connect the source to the gain node
        gainNode.connect(audioContext.destination); // Connect the gain node to the speakers

        audioContextRef.current = audioContext;
        gainNodeRef.current = gainNode;
        sourceRef.current = source;

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
      } catch (error) {
        console.error("Error accessing audio input:", error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100; // Update the gain value based on the slider
    }
  }, [volume]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value, 10);
    setVolume(newVolume);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img
          src={logo}
          className="App-logo"
          alt="logo"
          style={{ width: "100px" }}
        />
        <div>
          <label htmlFor="volume-slider">Volume: {volume}%</label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1000"
            value={volume}
            onChange={handleVolumeChange} // Handle volume changes
          />
        </div>

        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
