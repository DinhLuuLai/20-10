// audio.js - Hệ thống âm thanh Procedural Web Audio API + Trình phát nhạc nền & Visualizer

class AudioManager {
  constructor() {
    this.ctx = null;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.loop = true;
    this.isPlaying = false;
    this.analyser = null;
    this.sourceNode = null;
    this.dataArray = null;
    this.visualizerCanvas = null;
    this.canvasCtx = null;
    this.isMuted = false;
    this.hasUserInteracted = false;

    this.initAudioElement();
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  initAudioElement() {
    this.audioElement.addEventListener("play", () => {
      this.isPlaying = true;
      this.updateUIState();
    });
    this.audioElement.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateUIState();
    });
    this.audioElement.addEventListener("error", (e) => {
      console.warn("Audio stream error or blocked, will retry or fallback", e);
      const fallbackUrl = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112199.mp3";
      if (this.audioElement.src && !this.audioElement.src.includes("pixabay")) {
        console.log("Audio not found on disk, playing backup melody");
        this.audioElement.src = fallbackUrl;
        if (this.isPlaying) {
          this.audioElement.play().catch(() => {});
        }
      }
    });
  }

  setupAnalyser() {
    if (this.analyser || !this.ctx) return;
    try {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.sourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (err) {
      // Cross origin might restrict createMediaElementSource in some browsers
      console.warn("Could not attach WebAudio analyser directly to audio element (CORS), fallback visualizer will simulate waveform.", err);
    }
  }

  setVisualizerCanvas(canvas) {
    this.visualizerCanvas = canvas;
    if (canvas) {
      this.canvasCtx = canvas.getContext("2d");
      this.startVisualizerLoop();
    }
  }

  startVisualizerLoop() {
    const render = () => {
      requestAnimationFrame(render);
      if (!this.visualizerCanvas || !this.canvasCtx) return;

      const width = this.visualizerCanvas.width;
      const height = this.visualizerCanvas.height;
      this.canvasCtx.clearRect(0, 0, width, height);

      const numBars = 18;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (this.isPlaying) {
          if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            barHeight = (this.dataArray[i % this.dataArray.length] / 255) * height;
          } else {
            // Simulated rhythmic pulse
            const t = Date.now() / 200 + i * 0.4;
            barHeight = 4 + Math.sin(t) * (height * 0.4) + Math.cos(t * 1.5) * (height * 0.3);
            barHeight = Math.max(3, Math.min(height, barHeight));
          }
        }
        
        // Gradient gold / rose color
        const gradient = this.canvasCtx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "#ffd700");
        gradient.addColorStop(1, "#ff69b4");

        this.canvasCtx.fillStyle = gradient;
        this.canvasCtx.beginPath();
        this.canvasCtx.roundRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
        this.canvasCtx.fill();
      }
    };
    render();
  }

  playMusic(url) {
    this.ensureContext();
    this.setupAnalyser();
    if (url && (!this.audioElement.src || this.audioElement.src !== url)) {
      this.audioElement.src = url;
    }
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.updateUIState();
        })
        .catch((err) => {
          console.log("Autoplay was prevented by browser:", err);
          this.isPlaying = false;
          this.updateUIState();
          this.showAudioPrompt();
        });
    }
  }

  play() {
    const url = window.appStore ? window.appStore.get().music.url : undefined;
    return this.playMusic(url);
  }

  pause() {
    return this.pauseMusic();
  }

  pauseMusic() {
    this.audioElement.pause();
    this.isPlaying = false;
    this.updateUIState();
  }

  toggleMusic() {
    if (this.isPlaying) {
      this.pauseMusic();
      this.playSfx("pop");
    } else {
      const config = window.appStore.get();
      this.playMusic(config.music.url);
      this.playSfx("sparkle");
    }
  }

  updateUIState() {
    const playBtn = document.getElementById("music-toggle-btn");
    const cdDisc = document.getElementById("music-cd-disc");
    if (playBtn) {
      playBtn.classList.toggle("is-playing", this.isPlaying);
      playBtn.setAttribute("title", this.isPlaying ? "Tạm dừng nhạc" : "Phát nhạc nền");
    }
    if (cdDisc) {
      cdDisc.classList.toggle("spinning", this.isPlaying);
    }
  }

  showAudioPrompt() {
    const prompt = document.getElementById("music-autoplay-prompt");
    if (prompt) {
      prompt.classList.add("visible");
    }
  }

  hideAudioPrompt() {
    const prompt = document.getElementById("music-autoplay-prompt");
    if (prompt) {
      prompt.classList.remove("visible");
    }
  }

  // PROCEDURAL SOUND EFFECTS VIA WEB AUDIO API (Không cần tải file âm thanh ngoài!)
  playSfx(type = "sparkle") {
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (type === "sparkle") {
        // Chuỗi tiếng chuông ngân vàng lấp lánh (Sparkle Chime)
        const notes = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.05 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.4);
        });
      } else if (type === "pop") {
        // Tiếng bong bóng nổ nhẹ dễ thương
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "fanfare") {
        // Tiếng kèn chúc mừng hoành tráng mở hộp quà
        const chords = [
          { f: 523.25, t: 0 },    // C5
          { f: 659.25, t: 0.1 },  // E5
          { f: 783.99, t: 0.2 },  // G5
          { f: 1046.50, t: 0.35 },// C6
          { f: 1318.51, t: 0.45 },// E6
          { f: 1567.98, t: 0.55 } // G6
        ];
        chords.forEach((note) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.f, now + note.t);

          gain.gain.setValueAtTime(0.1, now + note.t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.6);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + note.t);
          osc.stop(now + note.t + 0.7);
        });
      } else if (type === "woosh") {
        // Hiệu ứng mở thư / lật trang
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.12);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.15);
      }
    } catch (e) {
      console.warn("SFX error", e);
    }
  }
}

window.audioManager = new AudioManager();
