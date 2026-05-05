///// This file contains anything that loads and plays sounds /////

// Low-latency audio via Web Audio API
const AudioEngine = (() => {
  let ctx = null
  const buffers = new Map()

  function getContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      ctx = new AC()
    }
    return ctx
  }

  async function ensureRunning() {
    const c = getContext()
    if (c.state !== 'running') {
      await c.resume()
    }
    return c
  }

  async function loadBuffer(url) {
    if (buffers.has(url)) return buffers.get(url)
    const c = getContext()
    const res = await fetch(url)
    const arr = await res.arrayBuffer()
    const buf = await c.decodeAudioData(arr)
    buffers.set(url, buf)
    return buf
  }

  function playBuffer(buffer, { when = 0 } = {}) {
    const c = getContext()
    const src = c.createBufferSource()
    src.buffer = buffer
    src.connect(c.destination)
    src.start(c.currentTime + when)
    return src
  }

  return { getContext, ensureRunning, loadBuffer, playBuffer }
})()

class AudioController {
  constructor(levelData) {
    this.levelData = levelData
    this._endedCb = null

    this._trackBuffer = null
    this._clickBuffer = null

    this._trackSource = null
    this._trackStartTime = null // AudioContext time when track started
    this._trackOffset = 0 // seconds (for restart/stop)
  }

  async preload() {
    // preload for lower latency; safe to call multiple times
    const [track, click] = await Promise.all([
      AudioEngine.loadBuffer(this.levelData.soundtrack),
      AudioEngine.loadBuffer(this.levelData.clickUrl || './soundtrack/click.wav'),
    ])
    this._trackBuffer = track
    this._clickBuffer = click
  }

  async ensureStarted() {
    await AudioEngine.ensureRunning()
    // preload on first user gesture; don't await elsewhere if you want non-blocking
    if (!this._clickBuffer || !this._trackBuffer) {
      await this.preload()
    }
  }

  async playTrack() {
    await this.ensureStarted()
    this.stopTrack()

    const c = AudioEngine.getContext()
    this._trackStartTime = c.currentTime
    this._trackOffset = 0
    this._trackSource = AudioEngine.playBuffer(this._trackBuffer)
    this._trackSource.onended = () => {
      this._trackSource = null
      this._trackStartTime = null
      if (this._endedCb) this._endedCb()
    }
  }

  stopTrack() {
    if (this._trackSource) {
      try { this._trackSource.stop() } catch (_) {}
      this._trackSource = null
    }
    this._trackStartTime = null
    this._trackOffset = 0
  }

  async playClick() {
    await this.ensureStarted()
    AudioEngine.playBuffer(this._clickBuffer)
  }

  // register a callback for when the track ends
  onEnded(cb) {
    this._endedCb = cb
  }

  // current playback position in seconds — used by rhythm engine and visuals
  get currentTime() {
    const c = AudioEngine.getContext()
    if (this._trackStartTime == null) return 0
    return Math.max(0, c.currentTime - this._trackStartTime + this._trackOffset)
  }
}