// One periodic day, starting at 07:00. Both slider endpoints are the same instant
// on consecutive days, so projection and light colour meet without a jump.
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function localCycle(date = new Date()) {
  return ((date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600 - 7 + 24) % 24) / 24;
}
export function clockLabel(t) {
  const minutes = Math.round((7 + t * 24) * 60) % 1440;
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
export function lightCycle(t) {
  const phase = (((t % 1) + 1) % 1) * Math.PI * 2;
  const elevation = Math.sin(phase);
  const daylight = smooth(-.15, .22, elevation);
  const cool = smooth(.12, .9, -elevation);
  const dayColour = [255, 229, 182];
  const eveningColour = [245, 220, 180];
  const nightColour = [224, 221, 211];
  const colour = eveningColour.map((v, i) =>
    Math.round(mix(mix(v, nightColour[i], cool), dayColour[i], Math.max(0, elevation))));
  return {
    // Low sun throws the patch far and long; noon pulls it in under the window.
    x: .875 - .09 * Math.cos(phase),
    y: .025 + .04 * Math.sin(phase),
    angle: .08 - .3 * Math.cos(phase),
    shear: -.3 * Math.cos(phase),
    stretch: 1 + .45 * (1 - Math.max(0, elevation)),
    beamWidth: .94 + .08 * daylight,
    beamLength: 1 + .22 * (1 - daylight),
    // Noon is bright enough for the warmth to survive the screen blend; night stays faint.
    intensity: .11 + .15 * daylight,
    // Noon shadows are crisp; dawn, dusk and night go soft.
    softness: 1 - .36 * daylight,
    colour,
    label: daylight > .85 ? 'sunlight' : Math.cos(phase) > 0 && elevation > -.2 ? 'dawn light' : cool > .5 ? 'soft night light' : 'warm exterior light',
  };
}
