///// This file contains only LEVEL DATA, no functions /////


const levels = [
  { // level 0 - tutorial
    scene: './scenes/bottle.jpg',
    revealScene: './scenes/opened_bottle.jpg',
    soundtrack: './soundtrack/tutorial_shortened.wav',
    beatTimes: [0.0, 1.714, 2.571, 4.286, 5.143, 6.857, 7.714, 9.429, 10.286, 12, 12.857, 14.571, 15.429],
    passingAccuracy: 0.5,
    maxError: 0.25,
    target: {
      x: 0.50,  // center of bottle
      y: 0.86,  // closer to bottle floor
      color: 'rgba(93, 179, 228, 0.7)',
      glowSize: '150px',
      colorSize: '50px',
      activationRadius: 120,  // px — how close player needs to be to activate
    }
  },
  
  { // level 1
    scene: './scenes/under_sea.jpg',
    revealScene: './scenes/above_sea.jpg',
    soundtrack: './soundtrack/tutorial_shortened.wav',
    beatTimes: [0.0, 1.714, 2.571, 4.286, 5.143, 6.857, 7.714, 9.429, 10.286, 12, 12.857, 14.571, 15.429],
    passingAccuracy: 0.5,
    maxError: 0.25,
    target: {
      x: 0.50,  // center of bottle
      y: 0.86,  // closer to bottle floor
      color: 'rgba(228, 113, 93, 0.7)',
      glowSize: '150px',
      colorSize: '50px',
      activationRadius: 120,  // px — how close player needs to be to activate
    }
  }


]


// Todo:
// Make retry show up a little bit later
// check if accuracy is calculated correctly and map it differently
// map it so it can be played more comfortably
// add levels