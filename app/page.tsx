'use client';

import { useState, useRef, useEffect } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { computeAUs } from '@/lib/auFeature';
import { computeMetrics } from '@/lib/metrics';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('are you ready to rizz?');
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [processingStep, setProcessingStep] = useState('');
  const [randomTopic, setRandomTopic] = useState('mysterious topics');

  // Action Unit descriptions
  const auDescriptions: Record<string, string> = {
    'AU01': 'Inner Brow Raiser',
    'AU02': 'Outer Brow Raiser', 
    'AU04': 'Brow Lowerer',
    'AU06': 'Cheek Raiser',
    'AU07': 'Lid Tightener',
    'AU09': 'Nose Wrinkler',
    'AU10': 'Upper Lip Raiser',
    'AU12': 'Lip Corner Puller',
    'AU14': 'Dimpler',
    'AU17': 'Chin Raiser',
    'AU23': 'Lip Tightener',
    'AU24': 'Lip Pressor',
    'AU25': 'Lips Part',
    'AU26': 'Jaw Drop',
    'AU45': 'Blink'
  };

  // Metrics descriptions
  const metricsDescriptions: Record<string, string> = {
    'head_tilt': 'Head Tilt Angle',
    'eye_openness': 'Eye Openness',
    'smile_symmetry': 'Smile Symmetry',
    'brow_symmetry': 'Brow Symmetry',
    'mouth_openness': 'Mouth Openness',
    'tension_index': 'Facial Tension',
    'confidence_index': 'Confidence Level'
  };
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

  // Generate random topic on component mount
  useEffect(() => {
    generateNewTopic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topics = [
    'the ethics of time-travel tourism',
    'why humans love spicy food',
    'the psychology of fandoms',
    'how black holes evaporate',
    'the rise of ai-generated music',
    'the color "blue" in ancient languages',
    'why cats loaf',
    'the future of space mining',
    'the mandela effect',
    'the science of déjà vu',
    'how memes spread like viruses',
    'deep-sea gigantism',
    'the trolley problem but with self-driving cars',
    'quantum entanglement explained simply',
    'the history of swear words',
    'dreams vs. memory consolidation',
    'parallel universes theories',
    'why pastries taste better in europe',
    'how planes actually stay in the air',
    'the psychology of procrastination',
    'whether aliens would understand human music',
    'the future of brain–computer interfaces',
    'why some people crave horror',
    'how coral reefs communicate',
    'the mystery of dark matter',
    'the philosophy of consciousness',
    'cultural impacts of superhero films',
    'why we yawn',
    'micro-habits that change productivity',
    'origins of common idioms',
    'the future of renewable energy',
    'how languages evolve',
    'the science of attraction',
    'whether robots can be morally responsible',
    'the history of the calendar',
    'why we find certain sounds satisfying (asmr)',
    'how rockets land themselves (spacex!)',
    'genetic engineering ethics',
    'the allure of dystopian fiction',
    'why cities develop unique "vibes"',
    'the placebo effect',
    'how music tempo affects mood',
    'the physics of rainbows',
    'why toddlers ask "why" nonstop',
    'internet culture cycles',
    'the origins of conspiracy theories',
    'how coffee became a global obsession',
    'the limits of human memory',
    'why board games are making a comeback',
    'the psychology of collecting things'
  ];

  const generateNewTopic = () => {
    const randomIndex = Math.floor(Math.random() * topics.length);
    setRandomTopic(topics[randomIndex]);
  };

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
        videoBitsPerSecond: 250000, // Reduce bitrate to ~250kbps for smaller files
      });
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 32000, // Reduce audio bitrate to 32kbps
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
      setTimeLeft(30);
      setStatus('recording...');
      setResults(null);

      // Start 10-second countdown
      recordingTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          setStatus('recording...');
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setStatus('error: ' + error.message.toLowerCase());
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
    setStatus('processing your rizz...');
    setProcessingStep('preparing files...');

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
        setStatus('error: no recording data captured.');
      return;
    }

    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    console.log('Original video size:', videoBlob.size, 'bytes');
    console.log('Original audio size:', audioBlob.size, 'bytes');

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

    // Send to server - Create fresh blobs to avoid "body disturbed" error
    const freshVideoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const freshAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('video', freshVideoBlob, 'recording.webm');
    formData.append('audio', freshAudioBlob, 'recording.webm');
    formData.append('aus', JSON.stringify(avgAUs));
    formData.append('metrics', JSON.stringify(avgMetrics));

    try {
      setProcessingStep('sending to server...');
      console.log('Sending request to /api/process...');
      console.log('Form data contents:', {
        video: freshVideoBlob.size + ' bytes',
        audio: freshAudioBlob.size + ' bytes',
        aus: Object.keys(avgAUs).length + ' action units',
        metrics: Object.keys(avgMetrics).length + ' metrics',
        videoChunks: videoChunksRef.current.length,
        audioChunks: audioChunksRef.current.length
      });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        setProcessingStep('request timed out...');
        controller.abort();
      }, 60000); // 60 second timeout

      setProcessingStep('analyzing audio and facial expressions...');
      
      // Try the main endpoint first, fallback to skip-audio if it fails
      let response;
      try {
        response = await fetch('/api/process', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } catch (mainError) {
        console.warn('Main API failed, trying skip-audio fallback:', mainError);
        setProcessingStep('retrying without audio transcription...');
        
        // Create a simpler FormData with just AUs and metrics
        const fallbackFormData = new FormData();
        fallbackFormData.append('aus', JSON.stringify(avgAUs));
        fallbackFormData.append('metrics', JSON.stringify(avgMetrics));
        
        response = await fetch('/api/skip-audio', {
          method: 'POST',
          body: fallbackFormData,
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      setProcessingStep('processing response...');

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          console.error('raw error response:', responseText);
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: `Server error: ${response.status} ${response.statusText}` };
          }
        } catch (parseError) {
          console.error('failed to read error response:', parseError);
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      setResults(data);
      setStatus('analysis complete!');
      setProcessingStep('');
      
      // Force UI update
      setTimeout(() => {
        setStatus('ready for another rizz check!');
      }, 2000);
    } catch (error: any) {
      console.error('Processing error:', error);
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out after 60 seconds. The server may be overloaded.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to server.';
      }
      
      setStatus('error: ' + errorMessage.toLowerCase());
      setProcessingStep('');
      
      // Also show debug info in the UI
      setResults({
        error: errorMessage,
        debug: {
          avgAUs,
          avgMetrics,
          ausFrames: ausDataRef.current.length,
          metricsFrames: metricsDataRef.current.length,
          videoSize: videoBlob.size,
          audioSize: audioBlob.size,
          errorType: error.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden" style={{backgroundColor: '#D6C0B3'}}>
      <div className="absolute inset-0 opacity-30 paper-texture" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,69,19,0.15) 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
      <div className="absolute top-20 left-16 w-24 h-24 bg-rose-200/20 rounded-full blur-2xl"></div>
      <div className="absolute top-40 right-24 w-32 h-32 bg-amber-200/25 rounded-full blur-xl"></div>
      <div className="absolute bottom-32 left-1/3 w-28 h-28 bg-stone-200/20 rounded-full blur-2xl"></div>
      <div className="absolute inset-0 shadow-inner" style={{boxShadow: 'inset 0 0 100px rgba(139,69,19,0.1)'}}></div>
      <h1 className="text-6xl font-bold mb-6 relative z-10 font-serif tracking-wide text-center" style={{color: '#AE2D80'}}>
        rate my rizz
      </h1>
      <div className="text-lg mb-8 text-center max-w-2xl relative z-10 font-bold italic leading-relaxed" style={{color: '#AE2D80'}}>
        <p className="mb-2">
          your date is talking about <span className="underline decoration-wavy">{randomTopic}</span>
        </p>
        <button 
          onClick={generateNewTopic}
          className="text-sm font-bold opacity-70 hover:opacity-100 transition-all underline hover:scale-105 cursor-pointer"
          style={{color: '#AE2D80'}}
          type="button"
        >
          get new topic
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-10 max-w-4xl w-full shadow-xl border-2 border-amber-200/50 relative z-10" style={{boxShadow: '0 25px 50px -12px rgba(139,69,19,0.25), inset 0 1px 0 rgba(255,255,255,0.6)'}}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full max-w-2xl mx-auto rounded-xl border-4 border-amber-300/60 mb-8 shadow-lg"
          style={{boxShadow: '0 10px 25px rgba(139,69,19,0.2)'}}
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="px-12 py-4 gold-button text-white font-bold rounded-full transition-all disabled:cursor-not-allowed shadow-lg text-xl border-2"
          >
            {isRecording ? 'recording...' : 'am i the rizzler?'}
          </button>
        </div>

        <div className="text-center mb-8" style={{color: '#AE2D80'}}>
          <p className="text-lg font-bold">{status.toLowerCase()}</p>
          {isRecording && (
            <div className="mt-4">
              <div className="text-4xl font-bold animate-pulse" style={{color: '#AE2D80'}}>{timeLeft}</div>
              <div className="text-lg font-bold italic" style={{color: '#AE2D80'}}>seconds of heartfelt words remaining</div>
            </div>
          )}
          {processingStep && !results && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <div className="text-lg font-bold italic" style={{color: '#AE2D80'}}>{processingStep.toLowerCase()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Debug: Show Action Units and Metrics */}
        {(ausDataRef.current.length > 0 || metricsDataRef.current.length > 0) && (
          <div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 mt-4">
            <h3 className="text-lg font-bold mb-2" style={{color: '#AE2D80'}}>debug info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {ausDataRef.current.length > 0 && (
                <div>
                  <h4 className="font-bold mb-1" style={{color: '#AE2D80'}}>action units (latest):</h4>
                  <div className="bg-black/30 p-2 rounded max-h-32 overflow-y-auto" style={{color: '#AE2D80'}}>
                    {Object.entries(ausDataRef.current[ausDataRef.current.length - 1] || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key} ({auDescriptions[key] || 'Unknown'}):</span>
                        <span>{typeof value === 'number' ? value.toFixed(3) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {metricsDataRef.current.length > 0 && (
                <div>
                  <h4 className="font-bold mb-1" style={{color: '#AE2D80'}}>metrics (latest):</h4>
                  <div className="bg-black/30 p-2 rounded max-h-32 overflow-y-auto" style={{color: '#AE2D80'}}>
                    {Object.entries(metricsDataRef.current[metricsDataRef.current.length - 1] || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key} ({metricsDescriptions[key] || 'Unknown'}):</span>
                        <span>{typeof value === 'number' ? value.toFixed(3) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs" style={{color: '#AE2D80'}}>
              captured {ausDataRef.current.length} frames of facial data
            </div>
          </div>
        )}

        {results && (
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 mt-8 border-2 border-amber-200/60" style={{boxShadow: '0 15px 35px rgba(139,69,19,0.15)'}}>
            <h2 className="text-3xl font-bold mb-6 text-center font-serif" style={{color: '#AE2D80'}}>your rizz analysis</h2>
            
            {/* Rizz Score Display */}
            {results.score !== undefined && (
              <div className="mb-8 text-center">
                <div className="relative inline-block">
                  <div className="text-7xl font-bold mb-2" style={{color: '#AE2D80'}}>
                    {results.score}
                    <span className="text-3xl">/100</span>
                  </div>
                  {results.rizzType && (
                    <div className="text-xl italic font-bold mt-2" style={{color: '#AE2D80'}}>
                      "{results.rizzType}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {results.transcription && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{color: '#AE2D80'}}>
                  what you said:
                </h3>
                <p className="text-lg leading-relaxed bg-white/50 p-6 rounded-xl border border-amber-200/50 italic font-bold" style={{color: '#AE2D80', boxShadow: 'inset 0 2px 4px rgba(139,69,19,0.1)'}}>{results.transcription?.toLowerCase()}</p>
              </div>
            )}
            {results.analysis && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{color: '#AE2D80'}}>
                  the verdict:
                </h3>
                <p className="bg-white/50 p-6 rounded-xl text-base leading-relaxed border border-amber-200/50 font-bold" style={{color: '#AE2D80', boxShadow: 'inset 0 2px 4px rgba(139,69,19,0.1)'}}>
                  {results.analysis?.toLowerCase()}
                </p>
              </div>
            )}
            {/* Debug: Show raw server response */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-bold" style={{color: '#AE2D80'}}>debug: raw server response</summary>
              <pre className="bg-black/50 p-2 rounded mt-2 text-xs overflow-auto max-h-40 font-bold" style={{color: '#AE2D80'}}>
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}

