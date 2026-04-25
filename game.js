
const div = document.querySelector('#sparkler')
const mask = document.querySelector('.mask')

//create a synth and connect it to the main output (your speakers)
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: {
    attack: 1,
    sustain: 0.5,
    release: 3
  }
}).toDestination();

//play a middle 'C' for the duration of an 8th note

function sparkle() {
	// add a spark to body
	var p = document.createElement('div')
	p.className = 'particle'
	// do this — add half the flame size to center the spawn point:
	p.style.left = (div.getBoundingClientRect().x + 0.5) + 'px'
	p.style.top  = (div.getBoundingClientRect().y + 0.5) + 'px'
	document.body.prepend(p)
	
	// move spark randomly across x/y axis
	setTimeout(function(){
		// let pp = document.querySelectorAll('.particle')[0],
		dir_x = Math.random() < .5 ? -0.5 : 1,
		dir_y = Math.random() < .5 ? -0.5 : 1
		
		p.style.left = parseInt(p.style.left) - (dir_x * (Math.random() * 70)) + 'px'
		p.style.top = parseInt(p.style.top) - (dir_y * (Math.random() * 70)) + 'px'
		p.style.opacity = '0'
		p.style.transform = 'scale(.25)'
		
		//remove spark once done moving
		setTimeout(function(){
			p.remove()
		},550)
		
	}, 10)
}


// If clicked, play a note
window.addEventListener('click', async() => {
  await Tone.start();
  synth.triggerAttackRelease("C4", "8n") // DOESN'T WORK, make it playy a note when clicked
});
// run the sparks
// let shiny = setInterval(sparkle, 100)

// click to change color
// , 'orange', 'blue'
let colors = ['gold'];
window.addEventListener('click', function() {
	for (let i = 0; i < 20; i++) {
		sparkle()
	}
})

window.addEventListener('click', function() {
  let flame = document.querySelector('.flame');
  flame.classList.add('flame-clicked');
  
  // Remove the class after animation finishes so it can play again
  setTimeout(() => {
    flame.classList.remove('flame-clicked');
  }, 500); // Match your animation duration
});


window.addEventListener('click', function() {
  let halo = document.querySelector('#sparkler');
  halo.classList.add('sparkler-clicked');
  
  // Remove the class after animation finishes so it can play again
  setTimeout(() => {
    halo.classList.remove('sparkler-clicked');
  }, 600); // Match your animation duration
});

// track mouse location and move sparkler
window.addEventListener('mousemove', function(e) {
  cursorX = e.clientX
  cursorY = e.clientY

  // move the flame to the cursor center
  document.querySelector('.flame').style.left = (cursorX - 5) + 'px'
  document.querySelector('.flame').style.top  = (cursorY - 5) + 'px'

  // move sparkler to same spot so sparks spawn at cursor
  div.style.left = cursorX + 'px'
  div.style.top  = cursorY + 'px'

  // cut a hole in mask
  mask.style.background = `radial-gradient(circle 200px at ${cursorX}px ${cursorY}px, transparent 80px, black 120px)`
})