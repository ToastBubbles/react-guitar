import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [strings, setStrings] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Buffer for storing recent frequency readings
  const frequencyBuffer = useRef<number[]>([]);
  const bufferSize = 10; // Number of readings to average

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new (window.AudioContext || window.AudioContext)();

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        // Configure analyser
        analyser.fftSize = 2048; // Larger size for better frequency resolution
        analyser.smoothingTimeConstant = 0.3; // Smooth out the data

        // Connect the nodes
        source.connect(analyser);
        analyser.connect(audioContext.destination); // Connect to speakers

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        setLoading(false);
        requestAnimationFrame(detectFrequencies);
      } catch (error) {
        console.error("Error accessing audio input:", error);
        setLoading(false);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  function detectFrequencies() {
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;

    if (analyser && audioContext) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const sampleRate = audioContext.sampleRate;
      const frequencies = Array.from(dataArray).map((value, index) => ({
        frequency: (index * sampleRate) / analyser.fftSize,
        magnitude: value,
      }));

      // Filter significant frequencies (adjust threshold based on testing)
      const significantFrequencies = frequencies
        .filter(({ magnitude }) => magnitude > 60) // Filter based on magnitude
        .map(({ frequency }) => frequency)
        .filter((f) => f > 80); // Filter out very low frequencies

      // Update the frequency buffer and compute the average
      frequencyBuffer.current.push(...significantFrequencies);
      if (frequencyBuffer.current.length > bufferSize) {
        frequencyBuffer.current = frequencyBuffer.current.slice(-bufferSize);
      }
      const averagedFrequencies =
        frequencyBuffer.current.reduce((acc, freq) => acc + freq, 0) /
        frequencyBuffer.current.length;

      // Deduplicate and round frequencies
      const roundedFrequencies = Math.round(averagedFrequencies / 10) * 10;

      setFrequencies([roundedFrequencies]);
      setStrings([mapFrequencyToString(roundedFrequencies)]);

      requestAnimationFrame(detectFrequencies);
    }
  }

  function mapFrequencyToString(frequency: number): string {
    if (frequency >= 80 && frequency < 120) return "6th String (Low E)";
    if (frequency >= 105 && frequency < 150) return "5th String (A)";
    if (frequency >= 140 && frequency < 200) return "4th String (D)";
    if (frequency >= 190 && frequency < 270) return "3rd String (G)";
    if (frequency >= 240 && frequency < 330) return "2nd String (B)";
    if (frequency >= 320 && frequency < 450) return "1st String (High E)";
    return "Unknown";
  }

  return (
    <div className="App">
      <header className="App-header">
        <img
          src={logo}
          className="App-logo"
          alt="logo"
          style={{ width: "100px" }}
        />
        {loading ? (
          <p>Loading audio...</p>
        ) : (
          <>
            <p>Detected frequencies: {frequencies.join(", ")}</p>
            <p>Strings detected: {strings.join(", ")}</p>
          </>
        )}
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
