/////////// All constants /////////

// let colors = ['gold'];
let cursorX = window.innerWidth / 2   // init cursorX position
let cursorY = window.innerHeight / 2  // init cursorY position
let targetX = window.innerWidth * 0.45 // init target position X
let targetY = window.innerHeight * 0.81 // init target position Y

let isPlaying = false // to determine if song is finished or not
let levelPassed = false 
let levelStarted = false

// 1. levelStarted=0 && levelPassed=1 -> next level
// 2. levelStarted=0 && levelStarted=0 && targetActivated=1 + transition -> restart / start level
// 3. levelStarted=1 && playSong=0 && target Activated=0 + target click -> targetActivated && playSong=1
// 4. playSong=0 (done) => levelStarted=0 and call windetermine
// 5. if win => levelPassed, if not win => levelPassed=0, go back to 2


let targetClose = false
let targetActivated = false  // init target to be deactivated
// so it stays invisible until clicked

// All relevant elements in DOM
const playerSparkler = document.querySelector('#player-sparkler')
const playerFlame = document.querySelector('#player-flame')
const targetSparkler = document.querySelector('#target-sparkler')
const targetFlame = document.querySelector('#target-flame')

const canvas = document.getElementById('mask')
const ctx = canvas.getContext('2d') // initialize canvas

// beat times
let beatTimes = [0.0, 1.714, 2.571, 4.286, 5.143, 6.857, 7.714, 9.429, 10.286, 12, 12.857, 14.571, 15.429]
const scoredBeats = new Set()  // keeps track of which beats were already scored

const passing_accuracy = 0.5 // how much accuracy is needed to pass
const maxError = 0.25; // maximum difference in hit and ideal allowed
const total_notes = 13; // total notes that should have been hit in the song

let hit_notes = 0; // number of nodes hit curretnly

// Relevant audios
const playerSound = new Audio("click.wav");
const tutorialSoundtrack = new Audio("tutorial_last_note_cut.wav");
const lastNote = new Audio("last_note.wav")

// Logic for music scoring (rhythm_accuracy)
let accuracy = 0.0;

// make canvas actual pixel size match screen size
canvas.width = window.innerWidth
canvas.height = window.innerHeight

// position the target sparkler div
targetSparkler.style.left = targetX + 'px' 
targetSparkler.style.top  = targetY + 'px'
// position the target flame div + offset by size
targetFlame.style.left = (targetX - 5) + 'px'  // -5 to center 10px flame
targetFlame.style.top  = (targetY - 5) + 'px'

function addNewScene(new_scene) {
  const img = document.createElement("img"); // create image element
  img.id = "scene";
  img.src = new_scene;
  document.body.appendChild(img); // /append img into body
}

function removeCurrentScene() {
  const old_scene = document.querySelector('#scene')
  old_scene.remove()
}

function sceneTransition(new_scene) {
  removeCurrentScene() // remove scene
  addNewScene(new_scene) // add new scene
  engulfingLight(targetX, targetY)
}

function engulfingLight(positionX, positionY) {
  const light = document.createElement('div'); // the expanding circle
  light.id = "light";
  document.body.appendChild(light); // append it into body
  light.style.setProperty('--start-x', positionX + 'px');
  light.style.setProperty('--start-y', positionY + 'px');
  console.log('LIGHT')
}

// function restartLevel() {
// }


// 1. Game starting listener 
document.addEventListener("click", function handleClick() {
  addNewScene("bottle.jpg"); // to start the game
  // remove listener so it never runs again
  document.removeEventListener("click", handleClick);
  engulfingLight(cursorX, cursorY)
});

// resize the canvas whenever the window is resized
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
})

// 1. Animation of black mask and hole //
// define draw mask with hole
function drawHoleOnMask() {
  // refill black every frame
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.globalCompositeOperation = 'destination-out'

  // draw player hole
  const playerGradient = ctx.createRadialGradient(cursorX, cursorY, 80, cursorX, cursorY, 130)
  playerGradient.addColorStop(0, 'rgba(0,0,0,1)')
  playerGradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = playerGradient
  ctx.beginPath()
  ctx.arc(cursorX, cursorY, 130, 0, Math.PI * 2)
  ctx.fill()

  // draw target hole
  if (targetActivated) {
    const targetGradient = ctx.createRadialGradient(targetX, targetY, 30, targetX, targetY, 50)
    targetGradient.addColorStop(0, 'rgba(0,0,0,1)')
    targetGradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = targetGradient
    ctx.beginPath()
    ctx.arc(targetX, targetY, 50, 0, Math.PI * 2)
    ctx.fill()
  }

  if (levelPassed) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)  // wipe canvas completely transparent
    return
  }

  // reset blend mode back to normal
  ctx.globalCompositeOperation = 'source-over'
}

// for one note, modifies total_accuracy and return current accuracy
function calculate_note_accuracy(t_hit, t_ideal) {
    let deltaT = t_hit - t_ideal

    if (Math.abs(deltaT) > maxError) return 0; // if more than allowed then missed

    const acc = 1 - (Math.abs(deltaT) / maxError);
    accuracy+=acc
    hit_notes++
    return accuracy/hit_notes
}

// for whole song, return final total accuracy
function calculate_rhythm_accuracy() {
  accuracy = accuracy / total_notes
  return accuracy
}

function getNextBeat(currentTime) {
  return beatTimes.find(t => t > currentTime)
}

function getPrevBeat(currentTime) {
  return [...beatTimes].reverse().find(t => t <= currentTime)
}

// Pass in "hit time" into this function, we call this whenever player clicked and level started
// and when the difference between the next beat and hit time is not over a certain window
function getNearestBeat(time) { // the one player is aiming for is min(next, prev)
  const prev = getPrevBeat(time)
  const next = getNextBeat(time)
  
  // handle edge cases — before first beat or after last beat
  if (!prev && !next) return null
  if (!prev) { // the first beat
    return Math.abs(next - time) <= maxError ? next : null // return difference if it's accepted
  }
  if (!next) { // the last beat
    return Math.abs(time - prev) <= maxError ? prev : null // return difference if it's accepted
  }
  
  // return whichever hit time was closer to
  const distPrev = time - prev
  const distNext = next - time
  const nearest = distPrev < distNext ? prev : next // minimum distance beat time of the two
  const nearestDist = Math.min(distPrev, distNext) // minimum distance
  return nearestDist <= maxError ? nearest : null  // return nearest beat, not the distance

  // if nearest beat is outside the acceptance window, ignore the click
  // the acceptance window would be maximum error
  return nearestDist <= maxError ? nearest : null
}

function checkMissedBeats() {
  const currentTime = tutorialSoundtrack.currentTime
  
  beatTimes.forEach(beat => {
    // if beat has passed by more than maxError and was never scored
    if (currentTime - beat > maxError && !scoredBeats.has(beat)) {
      scoredBeats.add(beat)  // mark it so we don't check it again
      hit_notes++            // count it as an attempt
      // accuracy doesn't increase — effectively 0 for this note
    }
  })
}

function drawBeatIndicator() {
  if (!targetActivated || !isPlaying) return

  const currentTime = tutorialSoundtrack.currentTime
  const nextBeat = getNextBeat(currentTime)
  const prevBeat = getPrevBeat(currentTime)

  if (!nextBeat) {
    beatIndicator.style.opacity = 0
    return
  }

  const timeUntilBeat = nextBeat - currentTime

  const leadTime = Math.min(0.8, (nextBeat - prevBeat) * 0.5)// how early it appears

  //  not visible yet
  if (timeUntilBeat > leadTime) {
    beatIndicator.style.opacity = 0
    return
  }

  // already passed beat
  if (timeUntilBeat < 0) {
    beatIndicator.style.opacity = 0
    return
  }

  // progress: 1 -> 0 as we approach beat
  const progress = timeUntilBeat / leadTime

  const maxSize = 80
  const minSize = 10

  const size = minSize + (maxSize - minSize) * progress

  beatIndicator.style.width = size + 'px'
  beatIndicator.style.height = size + 'px'
  beatIndicator.style.opacity = 1

  // always dark while shrinking
  beatIndicator.style.setProperty('--beat-color', '#97b0c0')
}


function gameLoop() {
  drawHoleOnMask()
  drawBeatIndicator()  // draws on top of the mask
  if (isPlaying) checkMissedBeats()
  if (isPlaying && beatlight.classList.contains("beatlight-unactivated")) {
    beatlight.classList.remove("beatlight-unactivated")
  }
  requestAnimationFrame(gameLoop)
}

gameLoop() // starts immediately, draws black mask right away


// beat indicator animation
const beatIndicator = document.querySelector('#beat-indicator')
beatIndicator.style.setProperty('--start-x', targetX + 'px')
beatIndicator.style.setProperty('--start-y', targetY + 'px')


const score = document.querySelector('#score');

// when do we check a note's accuracy?
window.addEventListener('click', function() {
  if (isPlaying) {
    const t_hit = tutorialSoundtrack.currentTime
    const t_ideal = getNearestBeat(t_hit)

    if (t_ideal === null) return  // outside window, ignore

    if (scoredBeats.has(t_ideal)) return  // already scored this beat, ignore

    scoredBeats.add(t_ideal)
    calculate_note_accuracy(t_hit, t_ideal)
    score.textContent = "Accuracy: " + (100*accuracy/hit_notes) + "%";
  }
})
// if time of click - next note supposed to be hit is more than accepted window don't count it
  // if it is within accepted window, record the time of hit and t_ideal for that target note and call
  // calculate_note_accuracy(t_hit, t_ideal)
  // need to see what note is supposed to be played next or have been played?
  // have a list of note hit times?
  // and then just call it everytime it hits? (considering time stamps?)
  // is there a global time counter?
  // or time within the song since it started playing?
  // since the song started playing, we keep a timer
  // the timer will tell u what time it is when the player clicked
  // we compare hit time with closest note time (so the ideal time before hit time and the ideal after hit time)
  // see which one was closer
  // then we call calculate-note_accuracy on that minimum ideal time?


// 2. Make Mouse become the flame and halo sparkler //
// Mouse location tracking with flame and sparkler
window.addEventListener('mousemove', function(e) {
   // we are storing cursor positions here already, so no need for getclientboundrect
  cursorX = e.clientX
  cursorY = e.clientY
  trackPlayerMouse(cursorX, cursorY)
})

// Do Flame clicked & Sparkle clicked animation & sound when clicked
window.addEventListener('click', function() {
  
  // Enlarge player cursor and sparks animation when player clicks
  pulseSparkle(playerSparkler, playerFlame)
  spark(cursorX, cursorY)

  // Play sound when clicked
  playSound(playerSound)

  // Activate target if clicked near target
  detectTargetActivation()

  if (levelStarted) {
    
  }
});


function trackPlayerMouse(cursorX, cursorY) {
  // move the flame to the cursor center
  playerFlame.style.left = (cursorX - 5) + 'px'
  playerFlame.style.top  = (cursorY - 5) + 'px'

  // move sparkler to same spot so sparks spawn at cursor
  playerSparkler.style.left = cursorX + 'px'
  playerSparkler.style.top  = cursorY + 'px'
}


// Animation of sparkles appearing when clicked //
function sparkle(x, y, color = 'gold') {
	// add a spark to body
	var p = document.createElement('div')
	p.className = 'particle'
	// we already stored mouse positions in one of the listeners, so no need for getclientboundrect
  p.style.left = x + 'px'
  p.style.top  = y + 'px'
  p.style.setProperty('--color-spark', color) // set color
	document.body.prepend(p)
	
	// move spark randomly across x/y axis
	setTimeout(function(){ // run this after delay of 10 ms
		// let pp = document.querySelectorAll('.particle')[0],
		dir_x = Math.random() < .5 ? -0.5 : 1,
		dir_y = Math.random() < .5 ? -0.5 : 1
		
		p.style.left = parseInt(p.style.left) - (dir_x * (Math.random() * 70)) + 'px'
		p.style.top = parseInt(p.style.top) - (dir_y * (Math.random() * 70)) + 'px'
		p.style.opacity = '0'
		p.style.transform = 'scale(.25)'
		
		//remove spark once done moving
		setTimeout(function(){ // remove the sparkles after 550 millesecond
			p.remove()
		},550)
		
	}, 10)
}

// Do Sparkle animation with 20 sparkles when clicked
function spark(x, y, color = 'gold') {
  for (let i = 0; i < 20; i++) {
		sparkle(x, y, color)
	}
}

function detectTargetActivation() {
  const distance = Math.hypot(cursorX - targetX, cursorY - targetY)
  if (distance < 120) {
    if (!targetActivated) {
      targetActivated = true
      targetSparkler.classList.add('active')
      targetFlame.classList.add('active')
    }
    pulseSparkle(targetSparkler, targetFlame)
    beatLightGrow()
    // cut hole in mask — already handled in drawHoleOnMask with targetActivated check
    if (!isPlaying) {
      tutorialSoundtrack.play()
      isPlaying = true
    }
  }
}

// 6. Animation for pulsing sparkle for any given spark
function triggerAnimation(object, animation_class, animation_length) {
  object.classList.add(animation_class)
  setTimeout(() => {
    object.classList.remove(animation_class)
  }, animation_length)
}

function pulseSparkle(sparkler, flame) {
  triggerAnimation(sparkler, 'sparkler-clicked', 600)
  triggerAnimation(flame, 'flame-clicked', 600)
}

const beatlight = document.querySelector('#beat-indicator')
function beatLightGrow() {
  beatlight.style.setProperty('--beat-color', 'rgb(193, 218, 231)') // change indicator color
  beatlight.style.setProperty('--start-x', targetX + 'px') // position at target
  beatlight.style.setProperty('--start-y', targetY + 'px') // position at target
  triggerAnimation(beatlight, 'beatlight-clicked', 600)

  // set back to dark after animation finishes
  setTimeout(() => {
    beatlight.style.setProperty('--beat-color',   '#97b0c0')
  }, 600)

}

function playSound(sound) {
  sound.currentTime = 0; // ensures it can replay properly
  sound.play();
}

tutorialSoundtrack.addEventListener("play", () => {
  levelStarted = true;
});


function winning_detect() {
  if (accuracy >= passing_accuracy) {
    levelPassed = true
  }
  return levelPassed
}


// is song over? if it is, and winning condition is met, then level is passed
tutorialSoundtrack.addEventListener("ended", () => {
  playSound(lastNote) // TODO: fix the little lag between the last note fully play out and starting to play
  if (winning_detect()) {
    level_passed(targetX, targetY)
  } else {
    level_restart()
  }
});


// if pass, scene transition + target should flash
function level_passed(target_posX, target_posY) {
  engulfingLight(target_posX, target_posY)
  sceneTransition('opened_bottle.jpg')
  document.getElementById("scene").style.zIndex = "10";
}

const retryOverlay = document.getElementById('retry-overlay');
const retryBtn = document.getElementById('retry-btn');

function level_restart() {
  // stop everything
  tutorialSoundtrack.pause();
  isPlaying = false;
  levelStarted = false;

  // show UI
  retryOverlay.classList.add('show');
}

retryBtn.addEventListener('click', () => {
  retryOverlay.classList.remove('show');
  resetLevelState();
});

function resetLevelState() {
  // scoring
  accuracy = 0;
  hit_notes = 0;
  scoredBeats.clear();

  // state
  levelPassed = false;
  isPlaying = false;
  levelStarted = false;

  // audio
  tutorialSoundtrack.currentTime = 0;

  // UI
  score.textContent = "Accuracy: 0%";

  // target reset
  targetActivated = false;
  targetSparkler.classList.remove('active');
  targetFlame.classList.remove('active');
}