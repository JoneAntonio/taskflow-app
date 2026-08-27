"use client";

let audioContext: AudioContext | null = null;
let isUnlocked = false;

/**
 * Os browsers bloqueiam som automático sem interação prévia do utilizador.
 * Chamado uma vez, em qualquer clique na app, para "destrancar" o som —
 * depois disso, o alarme já consegue tocar sozinho quando um lembrete dispara.
 */
export function unlockAlarmAudio() {
  if (isUnlocked || typeof window === "undefined") return;
  try {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    isUnlocked = true;
  } catch {
    // silencioso — se o browser não suportar, a notificação do sistema continua a funcionar
  }
}

/** Toca uma sequência de 3 bips nítidos, ao estilo despertador. */
export function playAlarmSound() {
  if (!audioContext) return;
  const ctx = audioContext;
  if (ctx.state === "suspended") ctx.resume();

  const beepTimes = [0, 0.35, 0.7];
  beepTimes.forEach((offset) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880; // lá agudo — bem audível e distinto de outros sons da app
    gain.gain.setValueAtTime(0, ctx.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + offset + 0.25);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + offset);
    oscillator.stop(ctx.currentTime + offset + 0.3);
  });
}
