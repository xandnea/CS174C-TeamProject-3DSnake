import { tiny } from './examples/common.js';
const { vec3, Mat4, Shape } = tiny;


export class Grass_Blade extends Shape {
  constructor(segments = 6, base_width = 0.10, height = 0.45, curve = 0.12) {
    super("position", "normal", "texture_coord");
    const left = [];
    const right = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * height;
      const taper = Math.pow(1.0 - t, 1.7);
      const w = base_width * taper;

      // Small curve: bend in X more toward the top
      const x_curve = curve * (t * t);

      // Two vertices per "row"
      left.push(vec3(x_curve - w, y, 0));
      right.push(vec3(x_curve + w, y, 0));
    }

    // Push vertices into arrays
    // Normal for a flat blade (we’ll just do +Z for both sides)
    for (let i = 0; i <= segments; i++) {
      // left
      this.arrays.position.push(left[i]);
      this.arrays.normal.push(vec3(0, 0, 1));
      this.arrays.texture_coord.push(vec3(0, i / segments, 0));

      // right
      this.arrays.position.push(right[i]);
      this.arrays.normal.push(vec3(0, 0, 1));
      this.arrays.texture_coord.push(vec3(1, i / segments, 0));
    }
    for (let i = 0; i < segments; i++) {
      const a = 2 * i;       // left i
      const b = 2 * i + 1;   // right i
      const c = 2 * (i + 1);     // left i+1
      const d = 2 * (i + 1) + 1; // right i+1
      this.indices.push(a, b, c);
      this.indices.push(b, d, c);
    }
  }
}

/**
 * Helper: compute a wind sway angle (radians).
 */
export function grass_sway_angle(time_s, phase, wind_speed = 2.2, wind_amp = 0.20) {
  return wind_amp * Math.sin(time_s * wind_speed + phase);
}