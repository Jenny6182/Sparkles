///// This file contains everything that coordinates between files /////

// game_refactored.js — main coordinator
// depends on: levels.js, audio.js, rhythm.js, orb.js, visuals.js

// ---- Cursor position ----
let cursorX = window.innerWidth / 2
let cursorY = window.innerHeight / 2

let player

function initPlayer() {
  player = new Orb(cursorX, cursorY, {
    sparklerId: 'player-sparkler',
    flameId: 'player-flame',
    glowSize: '250px',
    colorSize: '100px',
    color: 'gold',
    zIndex: 2
  })
}

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
initPlayer()

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
      const anchor = targets.find(t => t.type === "anchor") // find anchor from list of targets
      if (anchor) engulfingLight(anchor.x, anchor.y) // play engulflight centered around anchor
      setTimeout(() => {
        loadScene(levels[currentLevelIndex].revealScene)
        setState(GameState.WAITING_NEXT)
      }, 120)
      break

    case GameState.FAILED:
      // Show retry UI immediately on fail (no perceived lag)
      targets.forEach(t => { // do dimming animation for all visible targets
        t.sparkler?.classList.add('target-dimmed')
        t.flame?.classList.add('target-dimmed')
      })
      setState(GameState.WAITING_RETRY)
      break

    case GameState.WAITING_NEXT:
      // revealed scene is showing — wait for click to continue
      break

    case GameState.WAITING_RETRY:
      retryOverlay.classList.add('show')
      break
  }
}


// ---- Level setup ----
let currentLevelIndex = 0
let audio, rhythm // to initialize rhythmEngine and audioController
let targets = [] // initialize the list of targets shared across levels
let passTriggered = false
let endTriggered = false

function initLevel(levelIndex) {
  const levelData = levels[levelIndex]

  // cleanup old target from previous level
  targets.forEach(t => {
    t.sparkler.remove()
    t.flame.remove()
  })

  targets = [] // reset targets array for each level after clean up

  // reset player orb for new level
  player.deactivate()
  player.moveTo(cursorX, cursorY)

  // load scene FIRST so targets sit above it (scene and target both use z-index 0 in style.css)
  loadScene(levelData.scene)

  // create target orb

  // create map to store target instances created using target information in targets array from level data
  targets = levelData.targets.map(t => { // t is each element in levelData.targets array
  const x = window.innerWidth * t.x // position x
  const y = window.innerHeight * t.y // position y

  const orb = new Orb(x, y, {
    sparklerId: t.type === "anchor" ? "target-sparkler" : "note-sparkler",
    flameId: t.type === "anchor" ? "target-flame" : "note-flame",
    color: t.color,
    glowSize: t.glowSize,
    colorSize: t.colorSize,
    activationRadius: t.activationRadius,
    startsHidden: t.type === "anchor" ? true : false  // anchor targets start hidden under mask
  })

  // attach gameplay properties
  orb.type = t.type
  orb.time = t.time
  orb.window = t.window
  orb.activationRadius = t.activationRadius

  orb.activated = false
  orb.visible = false

  return orb
  })

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
  const anchor = targets.find(t => t.type === "anchor")

  if (beatIndicator && anchor) {
    beatIndicator.style.setProperty('--start-x', anchor.x + 'px')
    beatIndicator.style.setProperty('--start-y', anchor.y + 'px')
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
      // advance to next level
      currentLevelIndex = (currentLevelIndex + 1) % levels.length
      setState(GameState.READY)
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
  if (!player || !audio || !rhythm) return

  // always player click feedback
  player.pulse()
  player.spark(20, 'gold')
  audio.playClick()

  const time = audio.currentTime
  let started = false

  targets.forEach(t => {
    const dist = t.isCloseTo(cursorX, cursorY, t.activationRadius)

    // ANCHOR TARGET
    if (t.type === "anchor") {
      if (!t.activated && dist) {
        t.activate()  // Call activate() to add .active class and show the target
        started = true

        showScore()
        updateScore(0)
      }

      if (t.activated && dist) {
        t.pulse()
        t.spark(10, t.color)
        beatLightGrow(t.x, t.y)
      }
    }

    // NOTE TARGET
    if (t.type === "note" && currentState === GameState.PLAYING) {

      const inWindow =
        Math.abs(time - t.time) <= t.window

      const isVisible = t.visible === true

      if (isVisible && inWindow && dist) {
        const accuracy = rhythm.hit(time)

        if (accuracy !== null) {
          updateScore(accuracy)
        }

        t.pulse()
        t.spark(10, t.color)
        beatLightGrow(t.x, t.y)
      }
    }
  })

  // apply state once
  if (started) {
    setState(GameState.PLAYING)
  }
}


// ---- Retry overlay ----
const retryOverlay = document.getElementById('retry-overlay')
const retryBtn = document.getElementById('retry-btn')

if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    retryOverlay.classList.remove('show')
    targets.forEach(t => { // remove every target-dimmed tag on each target when retry button is clicked
      t.sparkler?.classList.remove('target-dimmed')
      t.flame?.classList.remove('target-dimmed')
    })
    setState(GameState.READY)
  })
}


// ---- Game loop ----
function gameLoop() {
  const time = audio?.currentTime ?? 0

  targets.forEach(t => {
    if (t.type === "anchor") {
      t.visible = true
    }

    if (t.type === "note") {
      t.visible = Math.abs(time - t.time) <= t.window
    }
  })

  const isPassed = currentState === GameState.PASSED ||
                   currentState === GameState.WAITING_NEXT

  // draw mask — pass all active targets as array
  // const targetsForMask = targets
  const targetsForMask = targets.filter(t => t.visible)
  const playerPos = player || { x: cursorX, y: cursorY }
  drawHoleOnMask(playerPos, targetsForMask, isPassed)

  // draw beat indicator ring
  if (currentState === GameState.PLAYING && rhythm && audio) {
  const time = audio.currentTime

  // find active note first
  let activeNote = targets.find(t =>
    t.type === "note" &&
    t.visible &&
    Math.abs(time - t.time) <= t.window
  )

  if (activeNote) {
    drawBeatIndicator(activeNote, rhythm, time)
  } else {
    const anchor = targets.find(t => t.type === "anchor" && t.activated)
    if (anchor) {
      drawBeatIndicator(anchor, rhythm, time)
    }
  }
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