let videoStream = null;
let mediaRecorder = null;
let videoChunks = [];
let audioChunks = [];
let recordingStartTime = null;

const videoPreview = document.getElementById('videoPreview');
const videoCanvas = document.getElementById('videoCanvas');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const results = document.getElementById('results');
const transcriptionDiv = document.getElementById('transcription');
const analysisDiv = document.getElementById('analysis');

// Request camera and microphone access
async function initCamera() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
        });
        videoPreview.srcObject = videoStream;
        status.textContent = 'Camera ready! Click "Start Recording" to begin.';
        status.className = 'status ready';
    } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        status.textContent = 'Error: Could not access camera/microphone. Please allow permissions.';
        status.className = 'status error';
    }
}

// Start recording
async function startRecording() {
    try {
        videoChunks = [];
        audioChunks = [];
        
        // Create separate tracks for video and audio
        const videoTrack = videoStream.getVideoTracks()[0];
        const audioTrack = videoStream.getAudioTracks()[0];
        
        // Record video
        const videoStreamForRecording = new MediaStream([videoTrack]);
        const videoRecorder = new MediaRecorder(videoStreamForRecording, {
            mimeType: 'video/webm;codecs=vp8'
        });
        
        videoRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                videoChunks.push(event.data);
            }
        };
        
        // Record audio
        const audioStreamForRecording = new MediaStream([audioTrack]);
        const audioRecorder = new MediaRecorder(audioStreamForRecording, {
            mimeType: 'audio/webm'
        });
        
        audioRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        videoRecorder.start();
        audioRecorder.start();
        
        recordingStartTime = Date.now();
        mediaRecorder = { video: videoRecorder, audio: audioRecorder };
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = 'Recording... Click "Stop Recording" when done.';
        status.className = 'status recording';
        results.style.display = 'none';
        
    } catch (error) {
        console.error('Error starting recording:', error);
        status.textContent = 'Error starting recording: ' + error.message;
        status.className = 'status error';
    }
}

// Stop recording and process
async function stopRecording() {
    if (!mediaRecorder) return;
    
    stopBtn.disabled = true;
    status.textContent = 'Stopping recording...';
    status.className = 'status processing';
    
    // Stop both recorders
    const videoStopped = new Promise((resolve) => {
        mediaRecorder.video.onstop = resolve;
        mediaRecorder.video.stop();
    });
    
    const audioStopped = new Promise((resolve) => {
        mediaRecorder.audio.onstop = resolve;
        mediaRecorder.audio.stop();
    });
    
    await Promise.all([videoStopped, audioStopped]);
    
    // Wait a bit for all data chunks to be available
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (videoChunks.length === 0 || audioChunks.length === 0) {
        status.textContent = 'Error: No recording data captured. Please try again.';
        status.className = 'status error';
        startBtn.disabled = false;
        return;
    }
    
    // Create blobs
    const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    console.log(`Video size: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Audio size: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Send to server
    await sendToServer(videoBlob, audioBlob);
}

// Send video and audio to server
async function sendToServer(videoBlob, audioBlob) {
    const formData = new FormData();
    formData.append('video', videoBlob, 'recording.webm');
    formData.append('audio', audioBlob, 'recording.webm');
    
    try {
        // Try /process first (for FastAPI), fallback to /api/process if needed
        const apiUrl = '/process';
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.statusText);
        }
        
        const data = await response.json();
        
        // Display results
        if (data.transcription) {
            transcriptionDiv.innerHTML = `<h3>What you said:</h3><p>${data.transcription}</p>`;
        }
        
        if (data.analysis) {
            analysisDiv.innerHTML = `<h3>Rizz Analysis:</h3><pre>${data.analysis}</pre>`;
        }
        
        results.style.display = 'block';
        status.textContent = 'Analysis complete!';
        status.className = 'status complete';
        startBtn.disabled = false;
        
    } catch (error) {
        console.error('Error sending to server:', error);
        status.textContent = 'Error processing: ' + error.message;
        status.className = 'status error';
        startBtn.disabled = false;
    }
}

// Event listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);

// Initialize on page load
initCamera();

