import { tiny } from './examples/common.js';
import { grass_sway_angle } from './tiny_grass.js';

const { vec3, color, Mat4 } = tiny;

export const Board = class Board {
  constructor(grid_size, cell_size, seed = 1337) {
    this.grid_size = grid_size;
    this.cell_size = cell_size;

    const half = (grid_size * cell_size) / 2;
    this.x_bounds = [-half, half];
    this.z_bounds = [-half, half];


    this.blades_per_cell = 9;
    this.spawn_chance = 0.55; 
    this.jitter = 0.22;
    this.base_y = 0.02;
    this.min_scale = 0.7;
    this.max_scale = 1.2;
    this._rng_state = seed >>> 0;

    this._grass = [];
    this._generate_grass();
  }

  _rand() {
    this._rng_state = (1664525 * this._rng_state + 1013904223) >>> 0;
    return this._rng_state / 4294967296;
  }

  _generate_grass() {
    const half_board = (this.grid_size * this.cell_size) / 2;

    const grid = Math.floor(Math.sqrt(this.blades_per_cell)); 
    const step = this.cell_size / grid;

    for (let row = 0; row < this.grid_size; row++) {
      for (let col = 0; col < this.grid_size; col++) {
        if (this._rand() > this.spawn_chance) continue;

        const cell_x = -half_board + col * this.cell_size + this.cell_size / 2;
        const cell_z = -half_board + row * this.cell_size + this.cell_size / 2;

        for (let gz = 0; gz < grid; gz++) {
          for (let gx = 0; gx < grid; gx++) {
            const local_x = -this.cell_size / 2 + (gx + 0.5) * step;
            const local_z = -this.cell_size / 2 + (gz + 0.5) * step;
            const jx = (this._rand() - 0.5) * step * this.jitter;
            const jz = (this._rand() - 0.5) * step * this.jitter;

            const rotY = this._rand() * Math.PI * 2;
            const phase = this._rand() * Math.PI * 2;

            const s = this.min_scale + (this.max_scale - this.min_scale) * this._rand();

            const shade = 0.75 + 0.25 * this._rand();
            const blade_color = color(0.08 * shade, 0.55 * shade, 0.10 * shade, 1);

            this._grass.push({
              x: cell_x + local_x + jx,
              z: cell_z + local_z + jz,
              rotY,
              phase,
              scale: s,
              blade_color
            });
          }
        }
      }
    }
  }

  checkBorderCollision(snakeHeadPosition) {
    const x = snakeHeadPosition[0];
    const z = snakeHeadPosition[2];
    return (
      x < this.x_bounds[0] || x > this.x_bounds[1] ||
      z < this.z_bounds[0] || z > this.z_bounds[1]
    );
  }

  draw(webgl_manager, uniforms, shapes, materials) {
    const half_board = (this.grid_size * this.cell_size) / 2;
    for (let row = 0; row < this.grid_size; row++) {
      for (let col = 0; col < this.grid_size; col++) {
        const x = -half_board + col * this.cell_size + this.cell_size / 2;
        const z = -half_board + row * this.cell_size + this.cell_size / 2;

        let cell_color = color(0.2, 0.67, 0.3, 1);
        if ((row + col) % 2 === 0) cell_color = color(0.15, 0.75, 0.3, 1);

        const cell =
          Mat4.translation(x, 0, z)
            .times(Mat4.scale(this.cell_size / 2, 0.01, this.cell_size / 2));

        shapes.box.draw(webgl_manager, uniforms, cell, { ...materials.grass, color: cell_color });
      }
    }
    const t = uniforms.animation_time / 1000;

    for (const b of this._grass) {
      const sway = grass_sway_angle(t, b.phase, 2.2, 0.18);
      const blade =
        Mat4.translation(b.x, this.base_y, b.z)
          .times(Mat4.rotation(b.rotY, 0, 1, 0))
          .times(Mat4.rotation(sway, 0, 0, 1))
          .times(Mat4.scale(b.scale, b.scale, b.scale));

      shapes.grass_blade.draw(webgl_manager, uniforms, blade, { ...materials.grass, color: b.blade_color });
    }
  }
};