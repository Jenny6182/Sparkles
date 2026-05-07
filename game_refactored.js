///// This file contains everything that coordinates between files /////

// game_refactored.js — main coordinator
// depends on: levels.js, audio.js, rhythm.js, orb.js, visuals.js

// ---- Cursor position ----
let cursorX = window.innerWidth / 2
let cursorY = window.innerHeight / 2

// ---- Game States ----
const GameState = {
  INTRO: 'intro',                  // starting screen
  READY: 'ready',                  // scene loaded, waiting for player to find targets
  PLAYING: 'playing',              // song is playing, scoring active
  PASSED: 'passed',                // song ended, accuracy met — animation playing
  FAILED: 'failed',                // song ended, accuracy not met — animation playing
  WAITING_NEXT: 'waiting_next',    // reveal animation done, waiting for "next level" confirmation
  WAITING_RETRY: 'waiting_retry'   // fail animation done, failed screen showing, waiting for "retry" confirmation
}

let currentState = GameState.INTRO // initial state is starting screen

// WebAudio-backed UI clicks (lower latency than <audio>)
const introAudio = new AudioController({
  soundtrack: './soundtrack/tutorial.wav', // required shape for preload()
  clickUrl: './soundtrack/click.wav',
})
introAudio.preload().catch(() => {}) // best-effort preload; actual start requires gesture

// Initialize player orb at INTRO
let player = new Orb(cursorX, cursorY, {
  sparklerId: 'player-sparkler',
  flameId: 'player-flame',
  glowSize: '250px',
  colorSize: '100px',
  color: 'gold',
  zIndex: 2
})

// state setter
function setState(newState) {
  if (currentState === newState) return
  currentState = newState
  console.log('state ->', newState)

  switch (newState) {
    case GameState.INTRO:
      // nothing to do — wait for click
      break

    case GameState.READY:
      // scene is loaded, reset everything for this level
      initLevel(currentLevelIndex)
      break

    case GameState.PLAYING:
      // song starts — triggered by target activation
      audio.playTrack()
      break

    case GameState.PASSED:
      // trigger engulf animation; swap reveal scene almost immediately (avoid perceived "lag")
      engulfingLight(target.x, target.y)
      setTimeout(() => {
        loadScene(levels[currentLevelIndex].revealScene)
        setState(GameState.WAITING_NEXT)
      }, 120)
      break

    case GameState.FAILED:
      // Show retry UI after 0.5 seconds
      if (target?.sparkler) target.sparkler.classList.add('target-dimmed')
      if (target?.flame) target.flame.classList.add('target-dimmed')
      currentState = GameState.WAITING_RETRY  // set state without recursion
      setTimeout(() => {
        showRetryOverlay()
      }, 500)
      break

    case GameState.WAITING_NEXT:
      // revealed scene is showing — show success overlay after a delay for animations
      setTimeout(() => {
        showSuccessOverlay()
      }, 1500)
      break

    case GameState.WAITING_RETRY:
      retryOverlay.classList.add('show')
      break
  }
}


// ---- Level setup ----
let currentLevelIndex = 0
let audio, rhythm, target
let passTriggered = false
let endTriggered = false

function initLevel(levelIndex) {
  const levelData = levels[levelIndex]

  // cleanup old target from previous level
  if (target) {
    target.sparkler.remove()
    target.flame.remove()
  }

  // reset player orb for new level
  player.deactivate()
  player.moveTo(cursorX, cursorY)

  // load scene FIRST so targets sit above it (scene and target both use z-index 0 in style.css)
  loadScene(levelData.scene)

  // create target orb
  const targetX = window.innerWidth * levelData.target.x
  const targetY = window.innerHeight * levelData.target.y

  target = new Orb(targetX, targetY, {
    sparklerId: 'target-sparkler',
    flameId: 'target-flame',
    color: levelData.target.color,
    glowSize: levelData.target.glowSize,
    colorSize: levelData.target.colorSize,
    // Match original behavior: target exists under mask and is revealed by holes.
    // Do NOT opacity-hide it; do NOT force z-index (style.css handles it).
    startsHidden: false
  })

  if (target?.sparkler) target.sparkler.classList.remove('target-dimmed')
  if (target?.flame) target.flame.classList.remove('target-dimmed')

  // load audio for this level
  audio = new AudioController(levelData)
  audio.onEnded(() => onSongEnded())
  audio.preload().catch(() => {})

  // set up rhythm engine
  rhythm = new RhythmEngine(levelData.beatTimes, levelData.maxError)
  rhythm.reset()
  passTriggered = false
  endTriggered = false

  // position beat indicator at target
  const beatIndicator = document.querySelector('#beat-indicator')
  if (beatIndicator) {
    beatIndicator.style.setProperty('--start-x', targetX + 'px')
    beatIndicator.style.setProperty('--start-y', targetY + 'px')
    beatIndicator.classList.add('beatlight-unactivated')
  }

  // reset score display
  updateScore(0)
  hideScore()
}

function onSongEnded() {
  if (endTriggered) return
  const levelData = levels[currentLevelIndex]
  const finalAccuracy = rhythm.getFinalAccuracy(levelData.beatTimes.length)
  console.log('final accuracy:', finalAccuracy)

  if (finalAccuracy >= levelData.passingAccuracy) {
    setState(GameState.PASSED)
  } else {
    setState(GameState.FAILED)
  }
}


// ---- Mouse tracking ----
window.addEventListener('mousemove', (e) => {
  cursorX = e.clientX
  cursorY = e.clientY
  if (player) player.moveTo(cursorX, cursorY)
})


// ---- Click handler ----
window.addEventListener('click', async () => {
  // handle state-specific click behavior
  switch (currentState) {

    case GameState.INTRO:
      // first click starts the game
      const startText = document.getElementById('start-text')
      if (startText) startText.style.display = 'none'
      // make intro click feel the same as in-level click
      player.pulse()
      player.spark(20, 'gold')
      // Top priority: do not block visuals on audio init/decoding.
      // Kick audio init/play asynchronously so engulf+level start happen instantly.
      introAudio.ensureStarted().then(() => introAudio.playClick()).catch(() => {})

      // start level immediately; play engulf animation in parallel (no lag)
      engulfingLight(cursorX, cursorY)
      setState(GameState.READY)
      return

    case GameState.WAITING_NEXT:
      // handled by success overlay button — do nothing on general click
      return

    case GameState.WAITING_RETRY:
      // handled by retry button — do nothing on general click
      return

    case GameState.PASSED:
    case GameState.FAILED:
      // animation playing — ignore clicks
      return
  }

  // READY and PLAYING states — handle game clicks
  handleGameClick()
})

function handleGameClick() {
  if (!player || !target || !audio) return

  // always: pulse player and spawn sparks and play player's note sound
  player.pulse()
  player.spark(20, 'gold')
  audio.playClick()

  // if close to target — interact with it
  const levelData = levels[currentLevelIndex]
  if (target.isCloseTo(cursorX, cursorY, levelData.target.activationRadius)) {

    // activate target on first close click
    if (!target.activated) {
      target.activate()
      const beatIndicator = document.querySelector('#beat-indicator')
      if (beatIndicator) beatIndicator.classList.remove('beatlight-unactivated')
      showScore()
      updateScore(0)
      setState(GameState.PLAYING)
    }

    // pulse target and spawn its sparks
    if (target.activated) {
      target.pulse()
      target.spark(10, levelData.target.color)
      beatLightGrow(target.x, target.y)
    }

    // score the click if song is playing
    if (currentState === GameState.PLAYING) {
      const accuracy = rhythm.hit(audio.currentTime)
      if (accuracy !== null) {
        updateScore(accuracy)
      }
    }
  }
}


// ---- Retry overlay ----
const retryOverlay = document.getElementById('retry-overlay')
const retryBtn = document.getElementById('retry-btn')
const retryText = document.getElementById('retry-text')

function showRetryOverlay() {
  if (retryText) {
    retryText.textContent = levels[currentLevelIndex].retryMessage
  }
  retryOverlay.classList.add('show')
}

if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    retryOverlay.classList.remove('show')
    if (target?.sparkler) target.sparkler.classList.remove('target-dimmed')
    if (target?.flame) target.flame.classList.remove('target-dimmed')
    setState(GameState.READY)
  })
}

// ---- Success overlay ----
const successOverlay = document.getElementById('success-overlay')
const nextBtn = document.getElementById('next-btn')
const successText = document.getElementById('success-text')

function showSuccessOverlay() {
  if (successText) {
    successText.textContent = levels[currentLevelIndex].successMessage
  }
  successOverlay.classList.add('show')
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    successOverlay.classList.remove('show')
    currentLevelIndex = (currentLevelIndex + 1) % levels.length
    setState(GameState.READY)
  })
}


// ---- Game loop ----
function gameLoop() {
  const isPassed = currentState === GameState.PASSED ||
                   currentState === GameState.WAITING_NEXT

  // draw mask — pass all active targets as array
  const targets = target ? [target] : []
  const playerPos = player || { x: cursorX, y: cursorY }
  drawHoleOnMask(playerPos, targets, isPassed)

  // draw beat indicator ring
  if (currentState === GameState.PLAYING && rhythm && audio && target) {
    drawBeatIndicator(target, rhythm, audio.currentTime)
  }

  // check for missed beats
  if (currentState === GameState.PLAYING && rhythm && audio) {
    rhythm.checkMissedBeats(audio.currentTime)
    // IMPORTANT: HUD previously only updated on hits; update after misses too.
    updateScore(rhythm.getAccuracy())
  }

  // If passed, trigger engulf shortly after the last note begins (without stopping the track)
  if (currentState === GameState.PLAYING && !endTriggered && rhythm && audio) {
    const levelData = levels[currentLevelIndex]
    const lastBeat = levelData.beatTimes[levelData.beatTimes.length - 1]
    const triggerTime = lastBeat + 0.06 // tiny delay after last note starts
    if (audio.currentTime >= triggerTime) {
      const finalAccuracy = rhythm.getFinalAccuracy(levelData.beatTimes.length)
      if (finalAccuracy >= levelData.passingAccuracy) {
        endTriggered = true
        passTriggered = true
        setState(GameState.PASSED)
      } else {
        endTriggered = true
        // On fail, do NOT stop the track; let it finish naturally (like pass).
        setState(GameState.FAILED)
      }
    }
  }

  requestAnimationFrame(gameLoop)
}

gameLoop()