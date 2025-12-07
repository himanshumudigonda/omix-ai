import { getWebSocketUrl } from '../lib/api';

export type VoiceGender = 'male' | 'female';

let ws: WebSocket | null = null;
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;
let recordContext: AudioContext | null = null;
let nextStartTime = 0;

export const connectLiveSession = async (
  voice: VoiceGender,
  modelId: string,
  onStatusChange: (status: string) => void
) => {
  console.log(`Connecting to Live Session...`);
  onStatusChange("Connecting...");

  try {
    // Initialize Audio Context for playback (Gemini usually sends 24kHz)
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    // Use configurable WebSocket URL for split deployment
    const wsUrl = getWebSocketUrl();
    // In development, we might be on port 5173 (Vite) but server is 3000
    const finalWsUrl = window.location.hostname === 'localhost' ? 'ws://localhost:3000' : wsUrl;
    
    ws = new WebSocket(finalWsUrl);

    ws.onopen = () => {
      console.log("WebSocket Connected");
      onStatusChange("Connected");
      
      const setupMessage = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'male' ? 'Puck' : 'Aoede' } }
            }
          }
        }
      };
      ws?.send(JSON.stringify(setupMessage));

      startAudioRecording();
    };

    ws.onmessage = async (event) => {
      let data;
      try {
          if (event.data instanceof Blob) {
              const text = await event.data.text();
              data = JSON.parse(text);
          } else {
              data = JSON.parse(event.data);
          }
      } catch (e) {
          console.error("Error parsing WebSocket message:", e);
          return;
      }

      if (data.serverContent?.modelTurn?.parts) {
        for (const part of data.serverContent.modelTurn.parts) {
          if (part.inlineData && part.inlineData.data) {
             playAudioChunk(part.inlineData.data);
          }
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Closed");
      onStatusChange("Disconnected");
      stopAudioRecording();
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      onStatusChange("Error");
    };

  } catch (error) {
    console.error("Connection failed:", error);
    onStatusChange("Error");
  }
};

export const disconnectLiveSession = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  stopAudioRecording();
};

const startAudioRecording = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create a separate AudioContext for recording at 16kHz (Gemini expects 16kHz)
    recordContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = recordContext.createMediaStreamSource(mediaStream);
    
    // Use ScriptProcessor for raw PCM access (AudioWorklet is better but more complex to setup in single file)
    processor = recordContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = floatTo16BitPCM(inputData);
      const base64Data = arrayBufferToBase64(pcmData);

      const audioMessage = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: "audio/pcm;rate=16000",
              data: base64Data
            }
          ]
        }
      };
      
      ws.send(JSON.stringify(audioMessage));
    };

    source.connect(processor);
    processor.connect(recordContext.destination);

  } catch (error) {
    console.error("Error starting audio recording:", error);
  }
};

const stopAudioRecording = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (recordContext) {
    recordContext.close();
    recordContext = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};

const playAudioChunk = (base64Data: string) => {
    if (!audioContext) return;

    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert PCM 16-bit to Float32
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
    }

    const buffer = audioContext.createBuffer(1, float32Array.length, 24000);
    buffer.getChannelData(0).set(float32Array);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    const currentTime = audioContext.currentTime;
    if (nextStartTime < currentTime) {
        nextStartTime = currentTime;
    }
    source.start(nextStartTime);
    nextStartTime += buffer.duration;
};

function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}