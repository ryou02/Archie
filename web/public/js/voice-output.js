const VoiceOutput = {
  audioContext: null,
  analyser: null,
  isSpeaking: false,
  energy: 0,
  onSpeechStart: null,
  onSpeechEnd: null,
  onSpeechEnergy: null,

  init() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  },

  async speak(text) {
    if (!text || text.trim() === "") return;

    // Ensure audio context is resumed (browser autoplay policy)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    try {
      const res = await fetch("/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("TTS request failed");

      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer =
        await this.audioContext.decodeAudioData(arrayBuffer);

      // Play audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      source.start();

      // Start lip-sync monitoring
      this.isSpeaking = true;
      this.energy = 0;
      if (this.onSpeechStart) {
        this.onSpeechStart();
      }
      this.monitorLipSync();

      source.onended = () => {
        this.isSpeaking = false;
        this.energy = 0;
        if (window.Avatar) {
          window.Avatar.setMouthOpen(0);
        }
        if (this.onSpeechEnergy) {
          this.onSpeechEnergy(0);
        }
        if (this.onSpeechEnd) {
          this.onSpeechEnd();
        }
      };
    } catch (err) {
      console.error("Voice output error:", err);
    }
  },

  monitorLipSync() {
    if (!this.isSpeaking) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Average volume → mouth openness (0 to 1)
    const avg =
      dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const mouthOpen = Math.min(avg / 128, 1);
    this.energy = this.energy * 0.72 + mouthOpen * 0.28;

    if (window.Avatar) {
      window.Avatar.setSpeechEnergy(this.energy);
    }

    if (this.onSpeechEnergy) {
      this.onSpeechEnergy(this.energy);
    }

    requestAnimationFrame(() => this.monitorLipSync());
  },
};
