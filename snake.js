import { tiny } from "./examples/common.js";
const { vec3, Mat4 } = tiny;
class Particle {
  constructor(pos, vel, mass) { // pos and vel are vec3
    this.pos = pos;
    this.vel = vel;
    this.mass = mass;
    this.f = vec3(0, 0, 0);
    this.prev_pos = pos.copy();
  }

  set_mass(new_mass) {
    this.mass = new_mass;
  }

  set_pos(new_pos) { 
    this.pos = new_pos.copy(); 
  }

  set_vel(new_vel) {
    this.vel = new_vel.copy();
  }

  apply_force(force_vec) {
    this.f = this.f.plus(force_vec);
  }
}

class Spring {
  constructor(p1_index = 0, p2_index = 0, rest_length = 0, stiffness = 0, damping = 0) {
    this.p1_i = p1_index;
    this.p2_i = p2_index;
    this.L = rest_length;
    this.Ks = stiffness;
    this.Kd = damping;
  }

  set(p1_index, p2_index, Ks, Kd, length) {
    this.p1_i = p1_index;
    this.p2_i = p2_index;
    this.Ks = Ks;
    this.Kd = Kd;
    this.L = length;
  } 

  update(particles) { // spring/damping forces calculation
    const p1 = particles[this.p1_i];
    const p2 = particles[this.p2_i];

    // calculate vector diff
    const delta = (p2.pos).minus(p1.pos);
    const dist = delta.norm();
    if (dist < 1e-6) return; // avoid division by zero
    const dir = delta.normalized();

    // spring forces (hooke's law) ==> F_s = -k_s*(dist_p - L_s)*direction
    const fs = dir.times(-this.Ks * (dist - this.L));

    // damping force ==> F_d = -k_d*(velocity_vec dot normalized dist_p)*direction
    const rel_v = (p2.vel).minus(p1.vel);
    const fd = dir.times(-this.Kd * rel_v.dot(dir));

    // apply forces
    const total_f = fs.plus(fd);
    p1.apply_force(total_f.times(-1));
    p2.apply_force(total_f);
  }
}

const Snake = class Snake {
  constructor(length = 3, node_distance = 0.2, start_point = vec3(0, 0.5, 0), integration = "symplectic") {
    this.length = length;
    this.node_distance = node_distance;
    this.particles = [];
    this.springs = [];

    // physics params
    this.dt = 0.002
    this.t_sim = 0;
    this.integration = integration;
    this.gravity = 0; 
    this.direction = vec3(0, 0, 1);
    this.speed = 2.0;

    // snake params:
    this.particle_width = 0.2;
    this.particle_height = 0.2;
    this.particle_length = 0.4;

    for (let i = 0; i < this.length; i++) {
      // start at the first spline point
      const pos = start_point.plus(vec3(0, 0, -i * node_distance));
      this.particles.push(new Particle(pos, vec3(0, 0, 0), 1));

      if (i > 0) {
        this.springs.push(new Spring(i - 1, i, node_distance, 1000, 30));
      }
    }
  }

  update(t, dt_frame) {
    // const forward_speed = 2.0;
    const wave_freq = 3.0;
    const wave_amp = 0.02;
    
    const inv_dt = 1 / Math.max(dt_frame, 1e-6);
    
    // Save old positions (COPIES) so velocity is correct
    const old_pos = this.particles.map(p => p.pos.copy());
      
    // Head target
    // const x = wave_amp * Math.sin(t * wave_freq);
    // const y = 0.5;
    // const z = -8 + ((t * forward_speed) % 16);
    // const lead_pos = vec3(x, y, z);
    const perpendicular_dir = vec3(this.direction[2], 0, this.direction[0]);
    const path = this.particles[0].pos.plus(this.direction.times(this.speed * dt_frame));
    const lead_pos = path.plus(perpendicular_dir.times(wave_amp * Math.sin(t * wave_freq)));
    
    // Move head (kinematic)
    this.particles[0].set_pos(lead_pos);
    this.particles[0].set_vel(lead_pos.minus(old_pos[0]).times(inv_dt));
    
    // Keep each segment exactly node_distance away from the previous one
    for (let i = 1; i < this.length; i++) {
      const prev = this.particles[i - 1].pos;   // new position of previous segment
      const cur_old = old_pos[i];               // old position of this segment (for direction + vel)
    
      // direction from prev -> this segment (based on last frame)
      let delta = this.particles[i].pos.minus(prev);
      let dist = delta.norm();
    
      let dir;
      if (dist < 1e-6) {
        // fallback direction if stacked
        dir = vec3(0, 0, -1);
      } else {
        dir = delta.times(1 / dist); // normalized
      }
    
      // Put segment i node_distance away from prev, along dir
      const target = prev.plus(dir.times(this.node_distance));
    
      this.particles[i].set_pos(target);
      this.particles[i].set_vel(target.minus(cur_old).times(inv_dt));
    }
  }

  setDirection(dir) {
    const opposite = this.direction.times(-1);
    if (dir.minus(opposite).norm() > 0.01) {
      this.direction = dir.normalized();
    }
  }

  simulate(h) {
    // reset forces on all particles
    for (let p of this.particles) p.f = vec3(0, 0, 0);

    // accumulate forces to determine how to move particle
    // -- gravity
    for (let p of this.particles) p.apply_force(vec3(0, -this.gravity * p.mass, 0));
    // -- springs
    for (let s of this.springs) s.update(this.particles);

    // integrate
    for (let p of this.particles) {
      if (p.mass <= 0) {
        p.vel = vec3(0, 0, 0);
        continue;
      }
      const accel = (p.f).times(1 / p.mass);

      if (this.integration == "euler") {
        // use current velocity to find new position 
        // x_t+1 = x_t + v_t * h 
        // v_t+1 = v_t + a_t * h
        p.pos = p.pos.plus(p.vel.times(h));
        p.vel = p.vel.plus(accel.times(h));
      } else if (this.integration == "symplectic") {
        // update velocity first then use new velocity to update positions
        // v_t+1 = v_t + a_t * h
        // x_t+1 = x_t + v_t+1 * h
        p.vel = p.vel.plus(accel.times(h));
        p.pos = p.pos.plus(p.vel.times(h));
      } else if (this.integration == "verlet") {
        // use difference between current pos and prev pos 
        // x_t+1 = 2x_t - x_t-1 + a_t * h^2
        const temp = p.pos;
        p.pos = p.pos.times(2).minus(p.prev_pos).plus(accel.times(h * h));
        p.prev_pos = temp;
        p.vel = p.pos.minus(p.prev_pos).times(1 / h); // (x_t - x_t-1)*(1/dt)
      }
    }
  }

  checkSelfCollision() {
    for (let i = 0; i < this.length; i++) {
      for (let j = i+2; j < this.length; j++) {
        const dist = this.particles[j].pos.minus(this.particles[i].pos).norm();
        if (dist < this.particle_length)
          return true;
      }
    }
    return false;
  }

  addSegment() {
    const last = this.particles[this.length - 1];
    const new_pos = last.pos.minus(this.direction.times(this.node_distance));
    this.particles.push(new Particle(new_pos, vec3(0, 0, 0), 1));
    this.springs.push(new Spring(this.length - 1, this.length, this.node_distance, 1000, 30));
    this.length++;
  }

  increaseSpeed(amount) {
    this.speed += amount;
  }
    
  draw(caller, uniforms, shapes, materials) {
    // draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      let matrix = Mat4.translation(p.pos[0], p.pos[1], p.pos[2]);

      // force each body part to look at the previous one
      let dir;
      if (i > 0) {
        const delta = this.particles[i - 1].pos.minus(p.pos);
        if (delta.norm() > 1e-6) {
          dir = delta.normalized();
        } else {
          dir = vec3(0, 0, 1); // fallback if particles are overlapping
        }
      } else {
        dir = this.direction.normalized();
      }

      let z_axis = dir;
      let x_axis = vec3(0, 1, 0).cross(z_axis); 
      if (x_axis.norm() < 1e-6) x_axis = vec3(1, 0, 0).cross(z_axis);
      x_axis = x_axis.normalized();
      let y_axis = z_axis.cross(x_axis).normalized();

      const rotation = Mat4.of(
        [x_axis[0], y_axis[0], z_axis[0], 0],
        [x_axis[1], y_axis[1], z_axis[1], 0],
        [x_axis[2], y_axis[2], z_axis[2], 0],
        [0, 0, 0, 1]
      );

      matrix = matrix.times(rotation)
                     .times(Mat4.scale(this.particle_width, this.particle_height, this.particle_length));

      shapes.ball.draw(caller, uniforms, matrix, materials.particle);
    }
  }
}

export { Snake };