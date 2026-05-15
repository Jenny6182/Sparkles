///// The Orb class (player mouse stuff is here because moving the flame is Orb class behavior) /////
// orb.js — represents any spark orb (player or target)

/*
Methods:
spawnparticle(), spark(): sparkle draws one particle flying out of a center, spark repeat sparkle 20 times to create 20 particles
pulseSparkle(): trigger the animation of enlarging halo and enlarging flame

*/
// TODO: add a child class that is "appearing disappearing" sparks

class Orb {
    constructor(x, y, options = {}) {
    this.x = x
    this.y = y
    this.activated = false

    // create sparkler element
    this.sparkler = document.createElement('div')
    this.sparkler.classList.add('sparkler')
    document.body.appendChild(this.sparkler)

    // create flame element
    this.flame = document.createElement('div')
    this.flame.classList.add('flame')
    document.body.appendChild(this.flame)

    // optional DOM ids so existing CSS rules apply (important for target visuals)
    if (options.sparklerId) this.sparkler.id = options.sparklerId
    if (options.flameId) this.flame.id = options.flameId

    // apply options like color
    if (options.color) {
      this.sparkler.style.setProperty('--color-spark', options.color)
    }
    if (options.glowSize) {
      this.sparkler.style.setProperty('--glow-size', options.glowSize)
    }
    if (options.colorSize) {
      this.sparkler.style.setProperty('--color-size', options.colorSize)
    }

    // ensure important stacking works even if CSS later overrides it
    if (typeof options.zIndex !== 'undefined') {
      this.sparkler.style.zIndex = String(options.zIndex)
      this.flame.style.zIndex = String(options.zIndex)
    }

    this.moveTo(x, y)
  }

  // move the orb to a new position
  moveTo(x, y) {
    this.x = x
    this.y = y
    this.sparkler.style.left = x + 'px'
    this.sparkler.style.top  = y + 'px'
    this.flame.style.left = (x - 5) + 'px'  // -5 centers 10px flame on the point
    this.flame.style.top  = (y - 5) + 'px'
  }

  // pulse the orb with clicked animation
  pulse() {
    this._triggerAnimation(this.sparkler, 'sparkler-clicked', 600)
    this._triggerAnimation(this.flame, 'flame-clicked', 600)
  }

  // check if a point is within threshold distance of this orb
  isCloseTo(x, y, threshold = 120) {
    return Math.hypot(x - this.x, y - this.y) < threshold
  }

  // spawn spark particles from this orb's position
  spark(count = 20, color = 'gold') {
    for (let i = 0; i < count; i++) {
      spawnParticle(this.x, this.y, color)
    }
  }

  reset() {
    this.sparkler.classList.remove('active')
    this.flame.classList.remove('active')
  }

  hide() {
    // CSS animations (blinkIt / flame) can override opacity visually,
    // so disable animations entirely until activation.
    this.sparkler.style.opacity = '0'
    this.flame.style.opacity = '0'
    this.sparkler.style.animation = 'none'
    this.flame.style.animation = 'none'
  }

  show() {
    this.sparkler.style.opacity = '1'
    this.flame.style.opacity = '1'
    this.sparkler.style.animation = ''
    this.flame.style.animation = ''
  }

    // internal helper — adds a class, removes it after duration
  _triggerAnimation(element, className, duration) {
    element.classList.add(className)
    setTimeout(() => element.classList.remove(className), duration)
  }
}

// standalone particle spawner — used by Orb.spark() and directly
// lives here since it's closely related to orb visuals
function spawnParticle(x, y, color = 'gold') {
  const p = document.createElement('div')
  p.className = 'particle'
  p.style.left = x + 'px'
  p.style.top  = y + 'px'
  p.style.setProperty('--color-spark', color)
  document.body.prepend(p)

  setTimeout(() => {
    const dir_x = Math.random() < 0.5 ? -0.5 : 1
    const dir_y = Math.random() < 0.5 ? -0.5 : 1

    p.style.left    = (parseInt(p.style.left) - dir_x * (Math.random() * 70)) + 'px'
    p.style.top     = (parseInt(p.style.top)  - dir_y * (Math.random() * 70)) + 'px'
    p.style.opacity = '0'
    p.style.transform = 'scale(0.25)'

    setTimeout(() => p.remove(), 550)
  }, 10)
}