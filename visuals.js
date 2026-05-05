/* 
----- This file contains anything that draws or animates on screen -----

Functions:
drawHoleOnMask(): draw the black mask over the scene picture and the holes ("light") that sparks make in the mask
drawBeatIndicator(): draw the closing and expanding circle around the targets
beatLightGrow(): trigger the animation of turning beat indicator light colored and expanding from target when "harmonizing" with player
engulfingLight(): trigger the animation of growing white circle from any given orb
triggerAnimation(): this is a helper to trigger any animation defined in css, such as pulseSparkle or beatLightGrow
loadScene(): animations and html manipulation for scene transitions
*/

// visuals.js — canvas drawing, animations, scene management

const canvas = document.getElementById('mask')
const ctx = canvas.getContext('2d')
const beatIndicator = document.querySelector('#beat-indicator')

// match canvas pixel size to screen — called on load and on resize
function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)


// ── Mask & holes ─────────────────────────────────────────────
// Draw black canvas and light holes from player and targets if activated
function drawHoleOnMask(player, targets, isPassed) {
  if (isPassed) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }

  // fill entire canvas black
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.globalCompositeOperation = 'destination-out'

  // player hole — always drawn
  drawGradientHole(player.x, player.y, 80, 130)

  // target holes — only when activated
  targets.forEach(target => {
    if (target.activated) {
      drawGradientHole(target.x, target.y, 30, 50)
    }
  })

  ctx.globalCompositeOperation = 'source-over'
}

// Helper for drawing gradient hole on canvas
function drawGradientHole(x, y, innerRadius, outerRadius) {
  const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius)
  gradient.addColorStop(0, 'rgba(0,0,0,1)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, outerRadius, 0, Math.PI * 2)
  ctx.fill()
}


// ── Beat indicator ring ───────────────────────────────────────

// draws the shrinking ring around the target on the canvas
// driven by real beat timing — no CSS animation
function drawBeatIndicator(target, rhythm, audioCurrentTime) {
  if (!target.activated) return
  if (!beatIndicator) return

  const nextBeat = rhythm.getNextBeat(audioCurrentTime)
  const prevBeat = rhythm.getPrevBeat(audioCurrentTime)

  if (!nextBeat) {
    beatIndicator.style.opacity = 0
    return
  }

  const timeUntilBeat = nextBeat - audioCurrentTime
  const leadTime = Math.min(0.8, prevBeat ? (nextBeat - prevBeat) * 0.5 : 0.8)

  if (timeUntilBeat > leadTime || timeUntilBeat < 0) {
    beatIndicator.style.opacity = 0
    return
  }

  const progress = timeUntilBeat / leadTime  // 1 → 0 as beat approaches
  const size = 10 + (80 - 10) * progress     // shrinks from 80px to 10px

  beatIndicator.style.width   = size + 'px'
  beatIndicator.style.height  = size + 'px'
  beatIndicator.style.opacity = 1
  beatIndicator.style.setProperty('--beat-color', '#97b0c0')
}

// burst animation when player clicks near target on beat
function beatLightGrow(targetX, targetY) {
  beatIndicator.style.setProperty('--beat-color', 'rgb(193, 218, 231)')
  beatIndicator.style.setProperty('--start-x', targetX + 'px')
  beatIndicator.style.setProperty('--start-y', targetY + 'px')

  beatIndicator.classList.add('beatlight-clicked')
  setTimeout(() => {
    beatIndicator.classList.remove('beatlight-clicked')
    beatIndicator.style.setProperty('--beat-color', '#97b0c0')
  }, 600)
}


// ── Scene management ──────────────────────────────────────────

function loadScene(scenePath) {
  // remove existing scene if any
  const old = document.querySelector('#scene')
  if (old) old.remove()

  const img = document.createElement('img')
  img.id = 'scene'
  img.src = scenePath
  document.body.appendChild(img)
}

// expanding white circle — plays on level pass or intro transition
function engulfingLight(x, y, onComplete, duration = 4000) {
  // remove any existing light div
  const existing = document.getElementById('light')
  if (existing) existing.remove()

  const light = document.createElement('div')
  light.id = 'light'
  light.style.setProperty('--start-x', x + 'px')
  light.style.setProperty('--start-y', y + 'px')
  document.body.appendChild(light)

  // call onComplete after animation finishes
  if (onComplete) {
    setTimeout(onComplete, duration)
  }
}


// ── Score display ─────────────────────────────────────────────

const scoreEl = document.querySelector('#score')
const accuracyTextEl = document.querySelector('#accuracy-text')
const accuracyFillEl = document.querySelector('#accuracy-fill')
const accuracyFlareEl = document.querySelector('#accuracy-flare')

function updateScore(accuracy) {
  if (!scoreEl) return
  const pct = Math.round(Math.max(0, Math.min(1, accuracy)) * 100)
  if (accuracyTextEl) accuracyTextEl.textContent = pct + '%'
  if (accuracyFillEl) accuracyFillEl.style.width = pct + '%'
  if (accuracyFlareEl) accuracyFlareEl.style.left = pct + '%'
}

function hideScore() {
  if (scoreEl) scoreEl.style.opacity = '0'
}

function showScore() {
  if (scoreEl) scoreEl.style.opacity = '1'
}



// function drawBeatIndicator() {
//   if (!targetActivated || !isPlaying) return

//   const currentTime = tutorialSoundtrack.currentTime
//   const nextBeat = getNextBeat(currentTime)
//   const prevBeat = getPrevBeat(currentTime)

//   if (!nextBeat) {
//     beatIndicator.style.opacity = 0
//     return
//   }

//   const timeUntilBeat = nextBeat - currentTime

//   const leadTime = Math.min(0.8, (nextBeat - prevBeat) * 0.5)// how early it appears

//   //  not visible yet
//   if (timeUntilBeat > leadTime) {
//     beatIndicator.style.opacity = 0
//     return
//   }

//   // already passed beat
//   if (timeUntilBeat < 0) {
//     beatIndicator.style.opacity = 0
//     return
//   }

//   // progress: 1 -> 0 as we approach beat
//   const progress = timeUntilBeat / leadTime

//   const maxSize = 80
//   const minSize = 10

//   const size = minSize + (maxSize - minSize) * progress

//   beatIndicator.style.width = size + 'px'
//   beatIndicator.style.height = size + 'px'
//   beatIndicator.style.opacity = 1

//   // always dark while shrinking
//   beatIndicator.style.setProperty('--beat-color', '#97b0c0')
// }



// //Q: SHOULD I BE USING TRIGGERANIMATION HERE?//
// // Animation of sparkles appearing when clicked //
// function sparkle(x, y, color = 'gold') {
// 	// add a spark to body
// 	var p = document.createElement('div')
// 	p.className = 'particle'
// 	// we already stored mouse positions in one of the listeners, so no need for getclientboundrect
//   p.style.left = x + 'px'
//   p.style.top  = y + 'px'
//   p.style.setProperty('--color-spark', color) // set color
// 	document.body.prepend(p)
	
// 	// move spark randomly across x/y axis
// 	setTimeout(function(){ // run this after delay of 10 ms
// 		// let pp = document.querySelectorAll('.particle')[0],
// 		dir_x = Math.random() < .5 ? -0.5 : 1,
// 		dir_y = Math.random() < .5 ? -0.5 : 1
		
// 		p.style.left = parseInt(p.style.left) - (dir_x * (Math.random() * 70)) + 'px'
// 		p.style.top = parseInt(p.style.top) - (dir_y * (Math.random() * 70)) + 'px'
// 		p.style.opacity = '0'
// 		p.style.transform = 'scale(.25)'
		
// 		//remove spark once done moving
// 		setTimeout(function(){ // remove the sparkles after 550 millesecond
// 			p.remove()
// 		},550)
		
// 	}, 10)
// }

// // Do Sparkle animation with 20 sparkles when clicked
// function spark(x, y, color = 'gold') {
//   for (let i = 0; i < 20; i++) {
// 		sparkle(x, y, color)
// 	}
// }

// // Helper to trigger any animation defined in css
// function triggerAnimation(object, animation_class, animation_length) {
//   object.classList.add(animation_class)
//   setTimeout(() => {
//     object.classList.remove(animation_class)
//   }, animation_length)
// }


// // Play animation for pulsing sparkle for any given spark
// function pulseSparkle(sparkler, flame) {
//   triggerAnimation(sparkler, 'sparkler-clicked', 600)
//   triggerAnimation(flame, 'flame-clicked', 600)
// }


// function beatLightGrow() {
//   beatlight.style.setProperty('--beat-color', 'rgb(193, 218, 231)') // change indicator color
//   beatlight.style.setProperty('--start-x', targetX + 'px') // position at target
//   beatlight.style.setProperty('--start-y', targetY + 'px') // position at target
//   triggerAnimation(beatlight, 'beatlight-clicked', 600)

//   // set back to dark after animation finishes
//   setTimeout(() => {
//     beatlight.style.setProperty('--beat-color',   '#97b0c0')
//   }, 600)
// }