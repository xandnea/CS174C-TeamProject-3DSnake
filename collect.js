import { tiny, defs } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export const Collectible = class Collectible {
    constructor(r, x_bound, z_bound, n, obstacles) {
        this.instances = []; // Collectible instances stored as vec3's
        this.r = r;
        this.size = r ** 2; // Store radius squared to reduce computation in update()
        this.score = 0;
        this.x_bounds = x_bound; // Grid boundary in form [x_lower, x_upper]
        this.z_bounds = z_bound;
        this.particles = []; // For collection particle effect
        this.obstacles = obstacles;

        this.spawn(n);
    }

    spawn(n) { // Spawns n collectibles. No checks to prevent spawning inside snake
        // for (let i = 0; i < n; i++) {
        //     const x = Math.floor(Math.random() * (this.x_bounds[1] - this.x_bounds[0])) + this.x_bounds[0] + 0.5;
        //     const z = Math.floor(Math.random() * (this.z_bounds[1] - this.z_bounds[0])) + this.z_bounds[0] + 0.5;
        //     this.instances.push(vec3(x, this.r + 0.1, z));
        // }
        let i = 0;
        while (i < n) {
            const x = Math.floor(Math.random() * (this.x_bounds[1] - this.x_bounds[0] - 1)) + this.x_bounds[0] + 1.5;
            const z = Math.floor(Math.random() * (this.z_bounds[1] - this.z_bounds[0] - 1)) + this.z_bounds[0] + 1.5;
            let blocked_by_obstacle = false;
            for (const obs of this.obstacles) {
                const dx = x - obs.pos[0];
                const dz = z - obs.pos[2];
                if (dx * dx + dz * dz < 1) {
                    blocked_by_obstacle = true;
                    break;
                }
            }
            if (blocked_by_obstacle) continue;
            this.instances.push(vec3(x, this.r + 0.1, z));
            i++;
        }
    }

    update(t, position) { // Takes position of snake head to check collision
        const hx = position[0];
        const hz = position[2];
        let i = 0;
        while (i < this.particles.length) { // Delete expired particle groups or update particles
            if (this.particles[i].die) {
                this.particles.splice(i, 1); // I really really really hope that the memory gets deallocated normally
            } else {
                this.particles[i].update();
                i++;
            }
        }
        i = 0; // Reusing the same iterator. Who cares
        while (i < this.instances.length) {
            const c = this.instances[i];
            if ((hx - c[0]) ** 2 + (hz - c[2]) ** 2 < this.size) {
                this.particles.push(new Sparkle(c[0], c[1], c[2]));
                this.instances.splice(i, 1);
                this.score += 1;
                this.spawn(1);
            } else {
                i++;
            }
        }
        const y = Math.sin(t) * 0.25 + 0.35;
        for (let i of this.instances) {
            i[1] = y;
        }
        console.log("hi");
    }

    draw(webgl_manager, uniforms, shapes, materials) {
        for (const i of this.instances) {
            const collect_transform = Mat4.translation(i[0], i[1], i[2]).times(Mat4.scale(this.r, this.r, this.r));
            shapes.ball.draw(webgl_manager, uniforms, collect_transform, { ...materials.collect, color: color(0.78, 0.31, 0.26, 1)});
        }
        for (const p of this.particles) {
            p.draw(webgl_manager, uniforms, shapes, materials);
        }
    }
}

// This was originally written for ThreeJS
class Sparkle {
    constructor(x, y, z) {
        this.die = false;
        const size = 60; // Number of particles. More would look better but I'm worried about performance
        this.r = 0.05; // This is probably huge
        this.lifetime = 1500; // Milliseconds
        this.createTime = Date.now();

        this.positions = [];
        this.velocities = [];
        for (let i = 0; i < size; i++) {
            this.positions[i] = vec3(x, y, z);
            this.velocities[i] = vec3(Math.random() * 0.1 - 0.05, Math.random() * 0.1, Math.random() * 0.1 - 0.05);
            // Probably want to modify these but we'll see
        }
    }

    update() {
        const deltaTime = Date.now() - this.createTime;
        if (Date.now() - this.createTime >= this.lifetime) {
            this.die = true;
            this.positions = null;
            this.velocities = null; // Probably not necessary but just to be safe
        } else {
            for (let i = 0; i < this.positions.length; i += 3) {
                this.positions[i] = this.positions[i].plus(this.velocities[i]);

                this.velocities[i][0] -= 0.001; // Simulated drag
                this.velocities[i][1] += (deltaTime / 1000) **2 * -0.008; // Gravitational decay
                this.velocities[i][2] -= 0.001;
            }
        }
    }

    draw(webgl_manager, uniforms, shapes, materials) {
        if (this.die) return;
        for (const i of this.positions) {
            const particle_transform = Mat4.translation(i[0], i[1], i[2]).times(Mat4.scale(this.r, this.r, this.r));
            shapes.ball.draw(webgl_manager, uniforms, particle_transform, { ...materials.collect, color: color(1, 0.94, 0.57, 1)});
        }
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