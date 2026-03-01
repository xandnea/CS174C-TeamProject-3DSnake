import { tiny, defs } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export const Board = class Board {
    constructor(grid_size, cell_size) {
        this.grid_size = grid_size;
        this.cell_size = cell_size;
        const half = (grid_size * cell_size) / 2;
        this.x_bounds = [-half, half]
        this.z_bounds = [-half, half];
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
        for (let row = 0; row < this.grid_size; row++) {
            for (let col = 0; col < this.grid_size; col++) {
                const x = -((this.grid_size * this.cell_size) / 2) + col * this.cell_size + this.cell_size / 2;
                const z = -((this.grid_size * this.cell_size) / 2) + row * this.cell_size + this.cell_size / 2;
                let cell_color = color(0.2, 0.67, 0.3, 1);
                if ((row + col) % 2 == 0)
                cell_color = color(0.15, 0.75, 0.3, 1);
                let cell = Mat4.translation(x, 0, z).times(Mat4.scale(this.cell_size / 2, 0.01, this.cell_size / 2));
                shapes.box.draw(webgl_manager, uniforms, cell, { ...materials.grass, color: cell_color });
            }
        }
    }
}