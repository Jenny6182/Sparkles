///// This file contains anything about beat timing and scoring /////

// rhythm.js — beat detection and scoring

class RhythmEngine {
  constructor(beatTimes, maxError = 0.25) {
    this.beatTimes = beatTimes // array of times when a note should be hit
    this.maxError = maxError // maximum allowed error
    this.scoredBeats = new Set() // beats already scored
    this.hitNotes = 0 // number of notes hit curretnly
    this.accuracy = 0 // storing current accuracy, will be modified during a songplay
  }

  // find the nearest beat to a given time, within maxError window
  // returns the beat timestamp, or null if no beat is close enough
  getNearestBeat(time) {
    const prev = [...this.beatTimes].reverse().find(t => t <= time)
    const next = this.beatTimes.find(t => t > time)

    if (!prev && !next) return null;

    if (!prev) return Math.abs(next - time) <= this.maxError ? next : null; // return difference if accepted
    if (!next) return Math.abs(time - prev) <= this.maxError ? prev : null;

    const nearest = Math.abs(time - prev) < Math.abs(next - time) ? prev : next; 
    // choose minimum of previous and next, see which one has minimum distance away from current time

    return Math.abs(nearest - time) <= this.maxError ? nearest : null; // return that nearest if difference is accepted
    // accepted means within maxError
  }

  // call this when the player clicks — scores the click against nearest beat
  // returns current running accuracy, or null if click was outside any beat window
  hit(time) {
    const beat = this.getNearestBeat(time); // use the nearest beat as the note player was attempting to hit

    if (!beat || this.scoredBeats.has(beat)) return null; // return null if no nearest beat, or beat already scored

    this.scoredBeats.add(beat); // add this beat into beats already scored

    // Score the accuracy using that nearest beat
    const error = Math.abs(time - beat);
    const acc = 1 - error / this.maxError;

    this.accuracy += acc; // add into total accuracy
    this.hitNotes++; // increase number of notes hit

    return this.getAccuracy();
  }

  // call this every frame to catch beats the player missed entirely
  checkMissedBeats(currentTime) {
    this.beatTimes.forEach(beat => {
      if (currentTime - beat > this.maxError && !this.scoredBeats.has(beat)) {
        this.scoredBeats.add(beat)
        this.hitNotes++
        // accuracy doesn't increase — effectively 0 for this note
      }
    })
  }

  // next beat coming up — used by visuals for the shrinking ring
  getNextBeat(time) {
    return this.beatTimes.find(t => t > time)
  }

  // previous beat — used by visuals for lead time calculation
  getPrevBeat(time) {
    return [...this.beatTimes].reverse().find(t => t <= time)
  }

  // current average accuracy across all scored notes - accuracy getter
  getAccuracy() { 
    if (this.hitNotes === 0) return 0
    return this.accuracy / this.hitNotes
  }

  // final accuracy against total expected notes — used for win/fail detection
  getFinalAccuracy(totalNotes) {
    if (totalNotes === 0) return 0
    return this.accuracy / totalNotes
  }

  reset() {
    this.scoredBeats.clear()
    this.hitNotes = 0
    this.accuracy = 0
  }
}