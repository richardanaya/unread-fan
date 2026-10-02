// Calm Heian loop. Yo scale on D, koto plucks over a soft drone and a slow flute.
// Master level stays low. A click or key resumes the context if the browser suspended it.
(function () {
  const BPM = 64;
  const BEAT = 60 / BPM;
  // D3 E3 G3 A3 B3 D4 E4 G4 A4 B4 D5
  const YO = [146.83, 164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33];

  // Each step is one beat. Null rests. Numbers are yo-scale indexes.
  const KOTO = [
    5, null, 7, null, 8, 6, null, 5,
    9, 8, null, 7, 6, null, 5, null,
    7, null, 8, 9, null, 8, 7, null,
    5, 6, null, 5, 3, null, 5, null,
  ];
  const FLUTE = [
    null, null, null, null, null, null, null, null,
    null, null, 8, null, 9, null, 8, 7,
    null, null, null, null, 6, null, 5, null,
    null, null, 7, null, 6, null, 5, null,
  ];

  let ctx;
  let master;
  let timer;
  let step;
  let nextTime;
  let running;

  function tone(time, freq, kind, peak, hold) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + hold);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + hold + 0.05);
  }

  function pluck(time, freq) {
    tone(time, freq, "triangle", 0.09, 1.35);
    tone(time, freq * 2, "sine", 0.028, 0.7);
    tone(time, freq * 3, "sine", 0.012, 0.35);
  }

  function blow(time, freq) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const dur = BEAT * 1.7;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.004, time);
    osc.frequency.linearRampToValueAtTime(freq, time + 0.25);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.045, time + 0.22);
    gain.gain.linearRampToValueAtTime(0.032, time + dur * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  function drone() {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 73.42;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    const fifth = ctx.createOscillator();
    const fifthGain = ctx.createGain();
    fifth.type = "sine";
    fifth.frequency.value = 110;
    fifthGain.gain.value = 0.012;
    fifth.connect(fifthGain);
    fifthGain.connect(master);
    fifth.start();
  }

  function tick() {
    if (!ctx || !running) return;
    const horizon = ctx.currentTime + 0.35;
    while (nextTime < horizon) {
      const k = KOTO[step];
      const f = FLUTE[step];
      if (k != null) pluck(nextTime, YO[k]);
      if (f != null) blow(nextTime, YO[f]);
      step = (step + 1) % KOTO.length;
      nextTime += BEAT;
    }
  }

  function start() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1600;
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(filter);
      filter.connect(ctx.destination);
      drone();
      step = 0;
      nextTime = ctx.currentTime + 0.08;
      running = true;
      timer = setInterval(tick, 120);
      tick();
    }
    if (ctx.state === "suspended") ctx.resume();
    running = true;
  }

  function wake() {
    if (ctx && ctx.state === "suspended" && document.body.classList.contains("playing")) ctx.resume();
  }
  addEventListener("pointerdown", wake);
  addEventListener("keydown", wake);

  function pause() {
    running = false;
    if (ctx && ctx.state === "running") ctx.suspend();
  }

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.visibilityState === "hidden") pause();
    else if (document.body.classList.contains("playing")) start();
  });

  window.HeianMusic = { start: start, pause: pause };
})();
