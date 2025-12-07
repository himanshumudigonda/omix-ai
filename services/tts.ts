// Check if device is mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
};

// Split text into smaller chunks for better mobile TTS
const splitIntoChunks = (text: string, maxLength: number = 100): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
};

let isSpeaking = false;
let speechQueue: string[] = [];

const speakNext = () => {
  if (speechQueue.length === 0 || !isSpeaking) {
    isSpeaking = false;
    return;
  }

  const text = speechQueue.shift();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Get voices (may need to wait for them to load)
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                         voices.find(v => v.lang.startsWith('en-US')) ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Slower rate on mobile for better quality
  utterance.rate = isMobile() ? 0.9 : 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    // Small delay between chunks on mobile
    setTimeout(() => speakNext(), isMobile() ? 100 : 50);
  };

  utterance.onerror = (e) => {
    console.log('[TTS] Error:', e.error);
    // Try next chunk even if this one failed
    setTimeout(() => speakNext(), 100);
  };

  window.speechSynthesis.speak(utterance);
};

export const speak = (text: string) => {
  if (!window.speechSynthesis) return;

  // Cancel any currently playing speech
  stopSpeaking();

  // Wait a moment for cancel to complete
  setTimeout(() => {
    isSpeaking = true;
    
    // On mobile, split into smaller chunks to prevent stuttering
    if (isMobile()) {
      speechQueue = splitIntoChunks(text, 80);
    } else {
      speechQueue = splitIntoChunks(text, 150);
    }
    
    speakNext();
  }, 50);
};

export const stopSpeaking = () => {
  isSpeaking = false;
  speechQueue = [];
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};