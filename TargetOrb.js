
class TargetOrb extends Orb {
  constructor(x, y, options = {}) {
    super(x, y, options)

    this.activated = false
    this.hide()
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
  
  // activate the orb — makes it permanently visible and glowing
  activate() {
    this.activated = true

    this.sparkler.classList.add('active')
    this.flame.classList.add('active')

    this.show()
  }

  // deactivate — used on level reset
  deactivate() {
    this.activated = false

    this.sparkler.classList.remove('active')
    this.flame.classList.remove('active')

    this.hide()
  }

  reset() {
    this.deactivate()
  }
}