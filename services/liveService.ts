// Live Service is temporarily disabled due to SDK migration
// import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// import { GEMINI_API_KEY } from '../lib/models';

export type VoiceGender = 'male' | 'female';

export const connectLiveSession = async (
  voice: VoiceGender,
  onStatusChange: (status: string) => void
) => {
  console.warn("Live mode is currently disabled.");
  onStatusChange("Live Mode Unavailable");
};

export const disconnectLiveSession = () => {
  // No-op
};