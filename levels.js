///// This file contains only LEVEL DATA, no functions /////


// targets have two types, one is persistent (discoverable) "anchor",
// the other only appears on certain times called "notes"

const levels = [
  { // level 0 - tutorial
    scene: './scenes/bottle.jpg',
    revealScene: './scenes/opened_bottle.jpg',
    soundtrack: './soundtrack/tutorial_shortened.wav',
    beatTimes: [0.0, 1.714, 2.571, 4.286, 5.143, 6.857, 7.714, 9.429, 10.286, 12, 12.857, 14.571, 15.429],
    passingAccuracy: 0.5,
    maxError: 0.25,
    targets: [
      { // target 0
        type: "anchor",
        x: 0.50,  // center of bottle
        y: 0.50,  // closer to bottle floor
        color: 'rgba(93, 179, 228, 0.7)',
        glowSize: '150px',
        colorSize: '50px',
        activationRadius: 120,  // px — how close player needs to be to activate
      }, 
      { // target 1
        type: "note",
        x: 0.50,  // center of bottle
        y: 0.86,  // closer to bottle floor
        color: 'rgba(93, 179, 228, 0.7)',
        glowSize: '150px',
        colorSize: '50px',
        activationRadius: 120,  // px — how close player needs to be to activate
        time: 2.571, // what time it appears
        window: 0.6 // how long it shows 
      }
    ]

  },
  
  { // level 1
    scene: './scenes/under_sea.jpg',
    revealScene: './scenes/above_sea.jpg',
    soundtrack: './soundtrack/tutorial_shortened.wav',
    beatTimes: [0.0, 1.714, 2.571, 4.286, 5.143, 6.857, 7.714, 9.429, 10.286, 12, 12.857, 14.571, 15.429],
    passingAccuracy: 0.5,
    maxError: 0.25,
    targets: [
      {
        type: "anchor",
        x: 0.50,
        y: 0.86,
        color: 'rgba(228, 113, 93, 0.7)',
        glowSize: '150px',
        colorSize: '50px',
        activationRadius: 120
      }
    ]
  }


]


// Todo:
// Make retry show up a little bit later
// check if accuracy is calculated correctly and map it differently
// map it so it can be played more comfortably
// add levels