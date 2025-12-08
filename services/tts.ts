// Check if device is mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
};

let currentUtterance: SpeechSynthesisUtterance | null = null;
let isCurrentlySpeaking = false;

export const speak = (text: string) => {
  // Skip if already speaking to prevent overlap
  if (isCurrentlySpeaking) {
    console.log('[TTS] Already speaking, skipping');
    return;
  }

  if (!window.speechSynthesis) {
    console.log('[TTS] Speech synthesis not supported');
    return;
  }

  // Cancel any previous speech first
  window.speechSynthesis.cancel();

  // Allow up to ~150 words (approx 800 characters) on mobile, more on desktop
  const maxLength = isMobile() ? 800 : 1500;
  let textToSpeak = text;
  
  if (text.length > maxLength) {
    // Truncate at sentence boundary if possible
    textToSpeak = text.substring(0, maxLength);
    const lastSentence = textToSpeak.lastIndexOf('.');
    if (lastSentence > maxLength * 0.5) {
      textToSpeak = textToSpeak.substring(0, lastSentence + 1);
    }
  }

  isCurrentlySpeaking = true;

  // Small delay to ensure previous speech is fully cancelled
  setTimeout(() => {
    try {
      currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Get voices
      let voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        const preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (preferredVoice) {
          currentUtterance.voice = preferredVoice;
        }
      }

      // Simple settings - slower on mobile for clarity
      currentUtterance.rate = isMobile() ? 0.85 : 1.0;
      currentUtterance.pitch = 1.0;
      currentUtterance.volume = 0.9;

      currentUtterance.onend = () => {
        isCurrentlySpeaking = false;
        currentUtterance = null;
      };

      currentUtterance.onerror = (e) => {
        console.log('[TTS] Error:', e.error);
        isCurrentlySpeaking = false;
        currentUtterance = null;
      };

      window.speechSynthesis.speak(currentUtterance);
      
      // Safety timeout - force stop after 30 seconds max
      setTimeout(() => {
        if (isCurrentlySpeaking) {
          stopSpeaking();
        }
      }, 30000);
      
    } catch (e) {
      console.log('[TTS] Exception:', e);
      isCurrentlySpeaking = false;
    }
  }, 100);
};

export const stopSpeaking = () => {
  isCurrentlySpeaking = false;
  currentUtterance = null;
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};