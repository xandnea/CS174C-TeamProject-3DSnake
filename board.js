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
    this._rocks = [];

    this.rock_margin = 1;

    this.rocks_per_side = this.grid_size * 0.6;
    this.rock_rows = 1;
    this.rock_min_scale = 0.3;
    this.rock_max_scale = 0.7;

    this._generate_rocks();
  }
  _pick(arr) {
    return arr[Math.floor(this._rand() * arr.length)];
  }

  _generate_rocks() {
    const half = (this.grid_size * this.cell_size) / 2;
    const out = half + this.rock_margin;

    const rock_keys = [
      "rock_1_01","rock_1_02","rock_1_03","rock_1_04",
      "rock_2_01","rock_2_02","rock_2_03","rock_2_04",
      "rock_3_01","rock_3_02","rock_3_03","rock_3_04",
      "rock_4_01","rock_4_02","rock_4_03","rock_4_04",
      "rock_5_01","rock_5_02","rock_5_03","rock_5_04",
      "rock_6_01","rock_6_02","rock_6_03","rock_6_04",
    ];

    const total_len = this.grid_size * this.cell_size;
    const step = total_len / this.rocks_per_side;

    const add = (x, z, face_dir) => {
      const key = this._pick(rock_keys);

      const s = this.rock_min_scale +
                (this.rock_max_scale - this.rock_min_scale) * this._rand();

      const rotY = face_dir + (this._rand() - 0.5) * 0.8;

      const jx = (this._rand() - 0.5) * step * 0.4;
      const jz = (this._rand() - 0.5) * step * 0.4;

      this._rocks.push({ key, x: x + jx, z: z + jz, rotY, scale: s });
    };

    for (let i = 0; i < this.rocks_per_side; i++) {
      const x = -half + (i + 0.5) * step;
      add(x, -out, 0);
    }
    for (let i = 0; i < this.rocks_per_side; i++) {
      const x = -half + (i + 0.5) * step;
      add(x, +out, Math.PI);
    }
    for (let i = 0; i < this.rocks_per_side; i++) {
      const z = -half + (i + 0.5) * step;
      add(-out, z, Math.PI / 2);
    }
    for (let i = 0; i < this.rocks_per_side; i++) {
      const z = -half + (i + 0.5) * step;
      add(+out, z, -Math.PI / 2);
    }
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
      for (const r of this._rocks) {
        const rock_transform =
          Mat4.translation(r.x, 0.5, r.z)
            .times(Mat4.rotation(-Math.PI / 2, 1, 0, 0)) 
      
        if (shapes[r.key]) {
          shapes[r.key].draw(webgl_manager, uniforms, rock_transform, materials.rock);
        }
      }
  }
};