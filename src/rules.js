export const zoneRadius = seconds => Math.max(12, 105 - seconds * .45);
export const outsideZone = (x,z,r) => Math.hypot(x,z)>r;
export const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
