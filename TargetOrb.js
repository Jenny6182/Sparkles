
class TargetOrb extends Orb {
  constructor(x, y, options = {}) {
    super(x, y, options)

    this.activated = false
    this.hide()
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