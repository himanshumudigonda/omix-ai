import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GEMINI_API_KEY } from '../lib/models';

export type VoiceGender = 'male' | 'female';

let sessionPromise: Promise<any> | null = null;
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let inputSource: MediaStreamAudioSourceNode | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();

const MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }

  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectLiveSession = async (
  voice: VoiceGender,
  onStatusChange: (status: string) => void
) => {
  if (sessionPromise) return;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Voice Config: 
    // Fenrir -> Deep/Huge/Male voice
    // Aoede -> Sweet/Female voice
    const voiceName = voice === 'male' ? 'Fenrir' : 'Aoede';

    // Initialize Audio Contexts
    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    // Volume Gain Node (Boost volume)
    const outputNode = outputAudioContext.createGain();
    outputNode.gain.value = 1.8; // Boost volume by 80%
    outputNode.connect(outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    onStatusChange("Connecting to Gemini...");

    sessionPromise = ai.live.connect({
      model: MODEL,
      callbacks: {
        onopen: () => {
          onStatusChange("Listening (Live)");

          // Setup Input Stream
          if (!inputAudioContext) return;
          inputSource = inputAudioContext.createMediaStreamSource(stream);
          // Reduced buffer size to 2048 for lower latency (was 4096)
          scriptProcessor = inputAudioContext.createScriptProcessor(2048, 1, 1);

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);

            sessionPromise?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          inputSource.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (!outputAudioContext) return;

          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;

          if (base64EncodedAudioString) {
            // Adjust start time to ensure smooth playback
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);

            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              outputAudioContext
            );

            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);

            source.addEventListener('ended', () => {
              sources.delete(source);
            });

            source.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            sources.add(source);
          }

          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            for (const source of sources.values()) {
              source.stop();
              sources.delete(source);
            }
            nextStartTime = 0;
          }
        },
        onclose: () => {
          onStatusChange("Disconnected");
          disconnectLiveSession();
        },
        onerror: (err) => {
          console.error("Live Session Error", err);
          onStatusChange("Error: Connection Failed");
          disconnectLiveSession();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },
        systemInstruction: "You are Omix AI. Speak quickly, concisely, and naturally, like a friend on a phone call. Do not sound robotic. Use short sentences and natural intonation.",
      },
    });

    await sessionPromise;

  } catch (error) {
    console.error("Failed to connect live session", error);
    onStatusChange("Failed to Connect");
    disconnectLiveSession();
  }
};

export const disconnectLiveSession = () => {
  if (sessionPromise) {
    sessionPromise.then(session => session.close()).catch(() => { });
    sessionPromise = null;
  }

  if (inputSource) {
    inputSource.disconnect();
    inputSource = null;
  }

  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }

  if (inputAudioContext) {
    inputAudioContext.close();
    inputAudioContext = null;
  }

  if (outputAudioContext) {
    outputAudioContext.close();
    outputAudioContext = null;
  }

  nextStartTime = 0;
  sources.clear();
};