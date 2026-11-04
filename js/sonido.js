'use strict';
/* Saltos del Saber · Efectos de sonido sintetizados (sin archivos de audio). */
const Sonido = (() => {
  let ac = null, activo = true;
  function iniciar() {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; }
  }
  function tono(f1, f2, dur, tipo = 'square', vol = 0.05, retraso = 0) {
    if (!activo || !ac) return;
    const t = ac.currentTime + retraso;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const efectos = {
    salto: () => tono(320, 640, 0.12),
    foco: () => { tono(988, null, 0.06); tono(1319, null, 0.12, 'square', 0.05, 0.06); },
    golpe: () => tono(160, 90, 0.1, 'triangle', 0.12),
    bien: () => [523, 659, 784, 1047].forEach((f, i) => tono(f, null, 0.14, 'square', 0.045, i * 0.08)),
    mal: () => { tono(330, 220, 0.25, 'triangle', 0.08); tono(220, 160, 0.3, 'triangle', 0.08, 0.2); },
    pisar: () => tono(500, 180, 0.12),
    dano: () => tono(420, 70, 0.45, 'square', 0.05),
    poder: () => [392, 523, 659, 784, 1047].forEach((f, i) => tono(f, null, 0.1, 'triangle', 0.1, i * 0.06)),
    gis: () => tono(900, 500, 0.08, 'triangle', 0.08),
    meta: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tono(f, null, 0.18, 'square', 0.045, i * 0.13))
  };
  return {
    iniciar,
    reproducir(n) { try { if (efectos[n]) efectos[n](); } catch (e) { /* sin audio */ } },
    get activo() { return activo; },
    set activo(v) { activo = !!v; }
  };
})();
