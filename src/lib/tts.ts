export function speakBulgarian(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'bg-BG'; utterance.rate = 0.86;
  const voices = window.speechSynthesis.getVoices(); const bg = voices.find(v => v.lang.toLowerCase().startsWith('bg'));
  if (bg) utterance.voice = bg; window.speechSynthesis.speak(utterance); return true;
}
