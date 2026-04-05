/**
 * Represent time as hours, minutes, and seconds.
 */
export interface TimeHMS {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Set the values such that seconds >= 60 roll over to minutes and minutes >= 60
 * roll over to hours.
 */
function normalize(time: TimeHMS): TimeHMS {
  let { hours, minutes, seconds } = time;
  [seconds, minutes] = [seconds % 60, minutes + Math.floor(seconds / 60)];
  [minutes, hours] = [minutes % 60, hours + Math.floor(minutes / 60)];
  return { hours, minutes, seconds };
}

/**
 * Calculate the total seconds.
 */
function calculateSeconds(time: TimeHMS) {
  return time.hours * 3600 + time.minutes * 60 + time.seconds;
}

export default {
  normalize,
  calculateSeconds,
};
