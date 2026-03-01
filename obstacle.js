import { tiny, defs } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export const Obstacle = class Obstacle {
    constructor(r, x_bound, z_bound, n) {
        this.instances = [];
        this.x_bounds = x_bound;
        this.z_bounds = z_bound;
        this.r = r;
        for (let i = 0; i < n; i++) {
            this.instances.push(this.getPosition());
        }
    }

    getPosition() {
        const x = Math.floor(Math.random() * (this.x_bounds[1] - this.x_bounds[0])) + this.x_bounds[0];
        const z = Math.floor(Math.random() * (this.z_bounds[1] - this.z_bounds[0])) + this.z_bounds[0];
        let type = null;
        let radius = 0.5;
        const variant = Math.floor(Math.random() * 3);
        // if (Math.random() < 0.5) {
        //     type = "rock";
        //     radius = 0.6;
        // } else {
        //     type = "tree";
        //     radius = 0.5;
        // }
        type = "tree";
        return { pos: vec3(x, this.r, z), type, variant, radius };
}
    
    checkCollision(snakeHeadPosition) {
        for (let obstacle of this.instances) {
            const dist = snakeHeadPosition.minus(obstacle.pos).norm();
            if (dist < obstacle.radius)
                return true;
        }
        return false;
    }

    draw(webgl_manager, uniforms, shapes, materials) {
        for (const obstacle of this.instances) {
            if (obstacle.type == "tree") {
                const tree_transform = Mat4.translation(obstacle.pos[0], 2.8, obstacle.pos[2])
                    .times(Mat4.scale(1, 1, 1));
                shapes.tree1.draw(webgl_manager, uniforms, tree_transform, materials.tree1);
            }
        }
    }
}