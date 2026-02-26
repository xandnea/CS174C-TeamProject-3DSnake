import { tiny, defs } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export const Collectible = class Collectible {
    constructor(r, x_bound, z_bound, n) {
        this.instances = []; // Collectible instances stored as vec3's
        this.r = r;
        this.size = r ** 2; // Store radius squared to reduce computation in update()
        this.score = 0;
        this.x_bounds = x_bound; // Grid boundary in form [x_lower, x_upper]
        this.z_bounds = z_bound;

        this.spawn(n);
    }

    spawn(n) { // Spawns n collectibles. No checks to prevent spawning inside snake
        for (let i = 0; i < n; i++) {
            const x = Math.floor(Math.random() * (this.x_bounds[1] - this.x_bounds[0])) + this.x_bounds[0] + 0.5;
            const z = Math.floor(Math.random() * (this.z_bounds[1] - this.z_bounds[0])) + this.z_bounds[0] + 0.5;
            this.instances.push(vec3(x, this.r + 0.1, z));
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

    draw(webgl_manager, uniforms, shapes, materials) {
        for (const i of this.instances) {
            const collect_transform = Mat4.translation(i[0], i[1], i[2]).times(Mat4.scale(this.r, this.r, this.r));
            shapes.ball.draw(webgl_manager, uniforms, collect_transform, { ...materials.collect, color: color(0.78, 0.31, 0.26, 1)});
        }
        // TODO Add scoreboard display of some kind
    }
}

/* 
== Notes for particle logic ==
May need to write extra class with function that collectible calls
No sprites in tinygraphics, need to represent particles with small 3D shapes (annoying!)

When triggered, generate ~30 random angles, shoot small orbs on trajectories from those angles
Orb upward angle is fixed, only angle on XZ plane varies
Blend of random() and pre determined angles to combine random appearance with nice distribution?
Orbs follow simple kinematics x(t) = x(0) + dt * v(t) + dt ** 2 * 0.5 * a
Track lifetime of orbs -- should there be some randomness?

==> Copy code directly from 174A project and modify for tinygraphics, probably

Concerned about efficiency running calculations for several dozen additional geometries every frame
Don't want to cause lag spike
*/