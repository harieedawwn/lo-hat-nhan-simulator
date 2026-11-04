export class Sound {
  constructor() { this.enabled = false; this.volume = 0.7; }
  async init() {}
  setEnabled(b) { this.enabled = !!b; }
  setVolume(v) { this.volume = v; }
  update() {}
  uiClick() {}
  suspend() {}
  resume() {}
}
