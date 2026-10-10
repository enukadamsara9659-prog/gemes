// Camera-relative map: world +X is east, world -Z is north.
export function cameraHeading(direction, fallback = 0) {
  if (Math.hypot(direction.x, direction.z) < 1e-6) return fallback;
  return Math.atan2(-direction.x, -direction.z);
}
export function mapPoint(position, center, heading, scale = .65, origin = 75) {
  const dx = position.x - center.x, dz = position.z - center.z;
  const cosine = Math.cos(heading), sine = Math.sin(heading);
  return {
    x: origin + (cosine * dx - sine * dz) * scale,
    y: origin + (sine * dx + cosine * dz) * scale,
  };
}
export function compassPoint(heading, radius = 62, origin = 75) {
  return { x: origin + Math.sin(heading) * radius, y: origin - Math.cos(heading) * radius };
}
