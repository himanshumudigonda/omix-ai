export const speak = (text: string) => {
  if (!window.speechSynthesis) return;

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices();
  // Prefer a "Google US English" voice or similar natural sounding one if available
  const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                         voices.find(v => v.lang.startsWith('en-US')) ||
                         voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 1.1; // Slightly faster
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};