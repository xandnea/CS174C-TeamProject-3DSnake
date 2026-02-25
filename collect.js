import { tiny, defs } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export const Collectible = class Collectible {
    constructor(r, bound) {
        this.instances = []; // Collectible instances stored as vec3's
        this.r = r;
        this.size = r ** 2; // Store radius squared to reduce computation in update()
        this.score = 0;
        this.bounds = bound; // Grid boundary in form [x_lower, x_upper, z_lower, z_higher]
    }

    spawn(n) { // Spawns n collectibles. No checks to prevent spawning inside snake
        for (let i = 0; i < n; i++) {
            const x = Math.floor(Math.random() * (this.bounds[1] - this.bounds[0])) + this.bounds[0];
            const z = Math.floor(Math.random() * (this.bounds[3] - this.bounds[2])) + this.bounds[2];
            this.instances.push(vec3(x, this.r + 1, z));
        }
    }

    update(t, position) { // Takes position of snake head to check collision
        const hx = position[0];
        const hz = position[2];
        let i = 0;
        while (i < this.instances.length) {
            if ((hx - this.instances[i][0]) ** 2 + (hz - this.instances[i][2]) ** 2 < this.size) {
                this.instances.splice(i, 1);
                this.score += 1;
                this.spawn(1);
            } else {
                i++;
            }
        }
        // TODO add a simple floating animation later
    }

    // TODO move this code to game.js
    // I'm writing it here bc game.js probably needs to be cleaned up, so this avoids adding more confusing stuff
    draw() {
        const collect_material = null; // TODO add custom texture of some kind
        for (const i of this.instances) {
            const collect_transform = Mat4.translation(i[0], i[1], i[2]).times(Mat4.scale(this.r, this.r, this.r));
            this.shapes.ball.draw(caller, this.uniforms, collect_transform, collect_material);
        }
    }
}