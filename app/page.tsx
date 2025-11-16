'use client';

import { useState, useRef, useEffect } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { computeAUs } from '@/lib/auFeature';
import { computeMetrics } from '@/lib/metrics';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Camera ready! Click "Start Recording" to begin.');
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const mediaRecorderRef = useRef<{ video: MediaRecorder; audio: MediaRecorder } | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const ausDataRef = useRef<Record<string, number>[]>([]);
  const metricsDataRef = useRef<Record<string, number>[]>([]);

  useEffect(() => {
    // Initialize MediaPipe Face Mesh
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && isRecording) {
        const landmarks = results.multiFaceLandmarks[0];
        const video = videoRef.current;
        if (video) {
          const aus = computeAUs(landmarks, video.videoWidth, video.videoHeight);
          const metrics = computeMetrics(landmarks, video.videoWidth, video.videoHeight);
          ausDataRef.current.push(aus);
          metricsDataRef.current.push(metrics);
        }
      }
    });

    faceMeshRef.current = faceMesh;

    // Initialize camera
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    }

    return () => {
      cameraRef.current?.stop();
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      const videoStream = new MediaStream([videoTrack]);
      const audioStream = new MediaStream([audioTrack]);

      const videoRecorder = new MediaRecorder(videoStream, {
        mimeType: 'video/webm;codecs=vp8',
      });
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm',
      });

      videoChunksRef.current = [];
      audioChunksRef.current = [];
      ausDataRef.current = [];
      metricsDataRef.current = [];

      videoRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      videoRecorder.start();
      audioRecorder.start();

      mediaRecorderRef.current = { video: videoRecorder, audio: audioRecorder };
      setIsRecording(true);
      setTimeLeft(10);
      setStatus('Recording... 10 seconds remaining');
      setResults(null);

      // Start 10-second countdown
      recordingTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          setStatus(`Recording... ${prev - 1} seconds remaining`);
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setStatus('Error: ' + error.message);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    // Clear the timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    setStatus('Processing your rizz...');

    const videoStopped = new Promise<void>((resolve) => {
      mediaRecorderRef.current!.video.onstop = () => resolve();
      mediaRecorderRef.current!.video.stop();
    });

    const audioStopped = new Promise<void>((resolve) => {
      mediaRecorderRef.current!.audio.onstop = () => resolve();
      mediaRecorderRef.current!.audio.stop();
    });

    await Promise.all([videoStopped, audioStopped]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (videoChunksRef.current.length === 0 || audioChunksRef.current.length === 0) {
      setStatus('Error: No recording data captured.');
      return;
    }

    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    // Calculate average AUs and metrics
    const avgAUs: Record<string, number> = {};
    const avgMetrics: Record<string, number> = {};

    if (ausDataRef.current.length > 0) {
      const keys = Object.keys(ausDataRef.current[0]);
      keys.forEach((key) => {
        avgAUs[key] =
          ausDataRef.current.reduce((sum, aus) => sum + (aus[key] || 0), 0) /
          ausDataRef.current.length;
      });
    }

    if (metricsDataRef.current.length > 0) {
      const keys = Object.keys(metricsDataRef.current[0]);
      keys.forEach((key) => {
        avgMetrics[key] =
          metricsDataRef.current.reduce((sum, m) => sum + (m[key] || 0), 0) /
          metricsDataRef.current.length;
      });
    }

    // Send to server
    const formData = new FormData();
    formData.append('video', videoBlob, 'recording.webm');
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('aus', JSON.stringify(avgAUs));
    formData.append('metrics', JSON.stringify(avgMetrics));

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      setStatus('Analysis complete!');
    } catch (error: any) {
      console.error('Processing error:', error);
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-white mb-8 drop-shadow-lg">Rate My Rizz</h1>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-4xl w-full shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full max-w-2xl mx-auto rounded-lg border-4 border-white/20 mb-6"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
          >
            Stop Recording
          </button>
        </div>

        <div className="text-center text-white mb-6">
          <p className="text-lg">{status}</p>
          {isRecording && (
            <div className="mt-2">
              <div className="text-2xl font-bold text-red-400">{timeLeft}</div>
              <div className="text-sm text-white/70">seconds remaining</div>
            </div>
          )}
        </div>

        {results && (
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">Your Rizz Analysis</h2>
            {results.transcription && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">What you said:</h3>
                <p className="text-white/90">{results.transcription}</p>
              </div>
            )}
            {results.analysis && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Rizz Analysis:</h3>
                <pre className="bg-black/30 text-white p-4 rounded-lg whitespace-pre-wrap">
                  {results.analysis}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

