import { format as d3format } from "d3-format"

const fFormat = d3format(",.2s")

export const duration2minutes = (dur) => {
    if(!dur) return 0
    let [days, time] = dur.split('-')
    let [hours, minutes] = time.split(':')
    let out = 1440 * (+days) + 60 * (+hours) + (+minutes)
    return isNaN(out) ? 0 : out
  }

export const  timeConvert = (n) => {
  var num = n;
  var hours = (num / 60);
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
  return rhours + " h  " + rminutes + " m";
}

export const vehicleDelay2cost = (delay,perUnit=1) => {
  if(!delay) return 0

  return `$${fFormat((delay/perUnit)*15)}`
}

 
