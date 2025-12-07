// Check if device is mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
};

let resumeTimer: ReturnType<typeof setInterval> | null = null;

export const speak = (text: string) => {
  if (!window.speechSynthesis) return;

  // Cancel any currently playing speech
  stopSpeaking();

  // Limit text length on mobile to prevent issues
  const maxLength = isMobile() ? 200 : 500;
  const textToSpeak = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  
  // Get voices
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                         voices.find(v => v.lang.startsWith('en-US')) ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Mobile-optimized settings
  if (isMobile()) {
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
  } else {
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
  }

  utterance.onend = () => {
    if (resumeTimer) {
      clearInterval(resumeTimer);
      resumeTimer = null;
    }
  };

  utterance.onerror = () => {
    if (resumeTimer) {
      clearInterval(resumeTimer);
      resumeTimer = null;
    }
  };

  // Chrome mobile bug fix: pause/resume to prevent audio cutting out
  if (isMobile()) {
    resumeTimer = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 3000);
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (resumeTimer) {
    clearInterval(resumeTimer);
    resumeTimer = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};