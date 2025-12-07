// Live Service is temporarily disabled due to SDK migration
// import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// import { GEMINI_API_KEY } from '../lib/models';

export type VoiceGender = 'male' | 'female';

export const connectLiveSession = async (
  voice: VoiceGender,
  modelId: string,
  onStatusChange: (status: string) => void
) => {
  console.log(`Connecting to Live Session with model: ${modelId} and voice: ${voice}`);
  
  // Simulate connection for now as real WebSocket requires backend proxy
  onStatusChange("Connecting...");
  
  setTimeout(() => {
    onStatusChange("Connected");
  }, 1500);
};

export const disconnectLiveSession = () => {
  console.log("Disconnected from Live Session");
};