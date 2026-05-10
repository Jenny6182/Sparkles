///// This file contains only LEVEL DATA, no functions /////


const levels = [
  { // level 0 - tutorial
    scene: './scenes/bottle.jpg',
    revealScene: './scenes/opened_bottle.jpg',
    soundtrack: './soundtrack/tutorial_shortened.wav',
    beatTimes: [0.0, 1.714, 2.571, 4.286, 5.143, 6.857, 7.714, 9.429, 10.286, 12, 12.857, 14.571, 15.429],
    passingAccuracy: 0.5,
    maxError: 0.25,
    retryMessage: 'The spark still needs your help... retry?',
    successMessage: 'Thank you for freeing me!',
    target: {
      x: 0.50,  // center of bottle
      y: 0.63,  // closer to bottle floor
      color: 'rgba(93, 179, 228, 0.7)',
      glowSize: '150px',
      colorSize: '50px',
      activationRadius: 120,  // px — how close player needs to be to activate
    }
  },
  
  { // level 1
    scene: './scenes/under_sea.jpg',
    revealScene: './scenes/above_sea.jpg',
    soundtrack: './soundtrack/level1_soundtrack.wav',
    clickUrl: './soundtrack/click.wav',
    beatTimes: [0, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 
      12.0, 13.5, 15.0, 16.5, 18.0, 19.5, 21.0, 22.5, 
      24.0, 25.5, 27.0, 28.5, 30.0, 31.5, 33.0, 34.5, 
      36.0, 37.5, 39.0, 40.5, 42.0, 43.5, 45.0, 46.5, 
      48.0, 49.5, 51.0, 52.5, 54.0, 55.5, 57.0, 58.5, 
      60.0, 61.5, 63.0, 64.5, 66.0, 67.5, 69.0, 70.5, 
      72.0, 73.5, 75.0, 76.5, 78.0, 79.5, 81.0, 82.5, 
      84.0, 85.5, 87.0, 88.5, 90.0, 91.5, 93.0, 94.5, 
      96.0, 97.5, 99.0, 100.5, 102.0, 103.5, 105.0, 106.5, 
      108.0, 109.5, 111.0, 112.5, 114.0, 115.5, 117.0, 118.5, 
      120.0, 121.5, 123.0, 124.5, 126.0, 127.5, 129.0, 130.5, 
      132.0, 133.5, 135.0, 136.5, 138.0, 139.5, 141.0, 142.5, 
      144.0, 145.5, 147.0, 148.5, 150.0],
    passingAccuracy: 0.5,
    maxError: 0.25,
    retryMessage: 'The spark is still freezing... try again?',
    successMessage: 'I never knew the world was this beautiful, thank you for showing me...',
    target: {
      x: 0.50,  // center of bottle
      y: 0.70,  // closer to bottle floor
      color: 'rgba(93, 179, 228, 0.7)',
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