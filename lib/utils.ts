import { Mood } from '../types';

export const analyzeSentiment = (text: string): Mood => {
  const lower = text.toLowerCase();
  
  if (lower.match(/\b(wow|amazing|love|great|awesome|happy|thanks|fun|haha|lol)\b/)) {
    return 'happy';
  }
  
  if (lower.match(/\b(sad|bad|error|fail|hate|angry|stupid|annoying)\b/)) {
    return 'angry';
  }
  
  if (lower.match(/\b(code|function|debug|analyze|report|strategy|plan|serious)\b/)) {
    return 'serious';
  }
  
  return 'neutral';
};

export const triggerConfetti = () => {
  // @ts-ignore
  if (typeof window.confetti === 'function') {
    // @ts-ignore
    window.confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
};