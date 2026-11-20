// ===================================================================
// LỄ TỐT NGHIỆP - JAVASCRIPT BẠN BÈ (MINH KHÁNH)
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
  initDOMContent();
  initAmbientCanvas();
  initAudioPlayer();
  initEnvelopeOpener();
  initCountdown();
  initGoogleCalendarLink();
});

/* ===================================================================
   1. POPULATE DOM FROM CONFIG
   =================================================================== */
function initDOMContent() {
  if (typeof CONFIG === "undefined") {
    console.error("CONFIG object not found! Please check config.js.");
    return;
  }

  setText("env-recipient-name", CONFIG.recipientGroup || "Mọi Người");
  setText("footer-year", new Date().getFullYear());

  if (CONFIG.letter) {
    if (CONFIG.letter.title) setText("letter-title", CONFIG.letter.title);
    if (CONFIG.letter.signOff) setText("letter-sign-off", CONFIG.letter.signOff);
    if (CONFIG.letter.senderSign) setText("letter-sender-sign", CONFIG.letter.senderSign);

    const letterBody = document.getElementById("letter-content");
    if (letterBody && Array.isArray(CONFIG.letter.paragraphs)) {
      letterBody.innerHTML = CONFIG.letter.paragraphs
        .map(p => `<p>${escapeHtml(p)}</p>`)
        .join("");
    }
  }

  if (CONFIG.graduation) {
    setText("info-uni", CONFIG.graduation.university || "Trường Đại học");
    setText("info-date", CONFIG.graduation.dateDisplay || "Thứ Ba, 24/11/2026");
    setText("info-time", CONFIG.graduation.timeDisplay || "Từ 09:00 Sáng");
    setText("info-hall", CONFIG.graduation.locationName || "Hội trường");
    setText("info-address", CONFIG.graduation.address || "12 Nguyễn Văn Bảo, Hạnh Thông, Hồ Chí Minh");

    if (CONFIG.graduation.timeNote) {
      setText("info-timenote", "Đến trước 15-20 phút");
    }

    const mapsBtn = document.getElementById("btn-maps");
    if (mapsBtn && CONFIG.graduation.googleMapsUrl) {
      mapsBtn.href = CONFIG.graduation.googleMapsUrl;
    }
  }

  if (CONFIG.giftNote) setText("info-gift-note", CONFIG.giftNote);

  if (CONFIG.music) {
    if (CONFIG.music.title) setText("music-title", CONFIG.music.title);
    if (CONFIG.music.artist) setText("music-artist", CONFIG.music.artist);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ===================================================================
   2. BACKGROUND MUSIC SYSTEM
   =================================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let synthTimer = null;
const bgAudio = document.getElementById("bg-audio");

function initAudioPlayer() {
  const toggleBtn = document.getElementById("music-toggle-btn");
  const vinylDisc = document.getElementById("vinyl-disc");

  if (bgAudio) {
    bgAudio.volume = 0.85;
    if (CONFIG.music && CONFIG.music.audioSrc) {
      bgAudio.src = CONFIG.music.audioSrc;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }
  if (vinylDisc) {
    vinylDisc.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }
}

function startMusicIfPossible() {
  if (isAudioPlaying) return;
  toggleMusic(true);
}

function toggleMusic(forcePlay = null) {
  const wantPlay = forcePlay !== null ? forcePlay : !isAudioPlaying;

  if (wantPlay) {
    if (bgAudio && bgAudio.src) {
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isAudioPlaying = true;
          updateMusicUI(true);
        }).catch(err => {
          console.warn("Falling back to Web Audio Piano:", err);
          startSynthPiano();
          isAudioPlaying = true;
          updateMusicUI(true);
        });
      }
    } else {
      startSynthPiano();
      isAudioPlaying = true;
      updateMusicUI(true);
    }
  } else {
    if (bgAudio) bgAudio.pause();
    stopSynthPiano();
    isAudioPlaying = false;
    updateMusicUI(false);
  }
}

function updateMusicUI(playing) {
  const musicIcon = document.getElementById("music-icon");
  const vinylDisc = document.getElementById("vinyl-disc");
  if (musicIcon) {
    musicIcon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
  }
  if (vinylDisc) {
    if (playing) vinylDisc.classList.add("playing");
    else vinylDisc.classList.remove("playing");
  }
}

// Built-in Piano Melody (Nostalgic & Bright)
const melodyNotes = [
  [261.63, 329.63, 392.00, 493.88, 523.25], // Cmaj7
  [220.00, 261.63, 329.63, 392.00, 440.00], // Am7
  [174.61, 261.63, 329.63, 349.23, 440.00], // Fmaj7
  [196.00, 246.94, 293.66, 392.00, 493.88]  // G6
];

let chordStep = 0;

function startSynthPiano() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  function playNextChord() {
    if (!isAudioPlaying) return;
    const currentChord = melodyNotes[chordStep % melodyNotes.length];
    
    currentChord.forEach((freq, i) => {
      setTimeout(() => {
        if (isAudioPlaying) playGentleNote(freq);
      }, i * 260);
    });

    chordStep++;
    synthTimer = setTimeout(playNextChord, 2600);
  }

  playNextChord();
}

function stopSynthPiano() {
  if (synthTimer) clearTimeout(synthTimer);
  synthTimer = null;
}

function playGentleNote(freq) {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.32, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(audioCtx.destination);
    gain2.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);
  } catch (e) {}
}

function playChimeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      }, idx * 110);
    });
  } catch (e) {}
}

/* ===================================================================
   3. INTERACTIVE ENVELOPE OPENING
   =================================================================== */
function initEnvelopeOpener() {
  const envelopeOverlay = document.getElementById("envelope-overlay");
  const envelopeCard = document.getElementById("envelope-card");
  const waxSealBtn = document.getElementById("wax-seal-btn");

  if (!envelopeOverlay || !envelopeCard) return;

  function openEnvelope() {
    envelopeCard.classList.add("open-anim");
    playChimeSound();

    startMusicIfPossible();

    setTimeout(() => {
      envelopeOverlay.classList.add("opened");
      if (typeof confetti === "function") {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#2563EB', '#E11D48', '#10B981']
        });
      }
    }, 800);
  }

  if (waxSealBtn) waxSealBtn.addEventListener("click", openEnvelope);
  envelopeCard.addEventListener("click", openEnvelope);
}

/* ===================================================================
   4. CELEBRATORY AMBIENT CANVAS (SPARKLES & CONFETTI DUST)
   =================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 35;
  const colors = ["#F59E0B", "#3B82F6", "#F43F5E", "#10B981", "#8B5CF6"];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 6 + 4,
      speedY: Math.random() * 1.0 + 0.6,
      speedX: Math.random() * 0.8 - 0.4,
      angle: Math.random() * 360,
      angularSpeed: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      isSquare: Math.random() > 0.5
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      ctx.beginPath();
      if (p.isSquare) {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.5;
      p.angle += p.angularSpeed;

      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) p.x = -20;
      if (p.x < -20) p.x = width + 20;
    });

    requestAnimationFrame(render);
  }

  render();
}

/* ===================================================================
   5. COUNTDOWN CLOCK
   =================================================================== */
function initCountdown() {
  const targetDateStr = CONFIG.graduation ? CONFIG.graduation.date : "2026-11-24T11:30:00";
  const targetTime = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minutesEl = document.getElementById("cd-minutes");
  const secondsEl = document.getElementById("cd-seconds");

  function update() {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = "00";
      if (hoursEl) hoursEl.textContent = "00";
      if (minutesEl) minutesEl.textContent = "00";
      if (secondsEl) secondsEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/* ===================================================================
   6. GOOGLE CALENDAR LINK GENERATION
   =================================================================== */
function initGoogleCalendarLink() {
  const btn = document.getElementById("btn-add-calendar");
  if (!btn || !CONFIG.graduation) return;

  const targetDate = new Date(CONFIG.graduation.date);
  const endDate = new Date(targetDate.getTime() + 3 * 60 * 60 * 1000);

  function formatGCalDate(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  }

  const title = encodeURIComponent(`Lễ Tốt Nghiệp của Minh Khánh (IUH)`);
  const details = encodeURIComponent(
    `Lễ Tốt Nghiệp của Minh Khánh tại Đại học Công nghiệp Thành phố Hồ Chí Minh.\n` +
    `Thời gian: ${CONFIG.graduation.timeDisplay || "Từ 11:30 Trưa"}\n` +
    `Lưu ý: Mong mọi người đến sớm trước khoảng 15-20 phút để thuận tiện tìm nhau trong khuôn viên trường nhé.\n` +
    `Địa chỉ: ${CONFIG.graduation.address || ""}\n` +
    `Rất mong được gặp và chụp cùng mọi người những bức hình kỷ niệm!`
  );
  const location = encodeURIComponent(`${CONFIG.graduation.locationName || ""}, ${CONFIG.graduation.address || ""}`);
  const dates = `${formatGCalDate(targetDate)}/${formatGCalDate(endDate)}`;

  btn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
