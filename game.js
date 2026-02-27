import {tiny, defs} from './examples/common.js';
import { Snake } from "./snake.js";
// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// TODO: you should implement the required classes here or in another file.
import {Board} from "./board.js"
import { Collectible } from './collect.js';

class Particle {
  constructor(pos, vel, mass) { // pos and vel are vec3
    this.pos = pos;
    this.vel = vel;
    this.mass = mass;
    this.f = vec3(0, 0, 0);
    this.prev_pos = pos;
  }

  set_mass(new_mass) {
    this.mass = new_mass;
  }

  set_pos(new_pos) {
    this.pos = new_pos;
  }

  set_vel(new_vel) {
    this.vel = new_vel;
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

export
const Part_one_spring_base = defs.Part_one_spring_base =
    class Part_one_spring_base extends Component
    {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                               // This particular scene is broken up into two pieces for easier understanding.
                                               // The piece here is the base class, which sets up the machinery to draw a simple
                                               // scene demonstrating a few concepts.  A subclass of it, Assign_one_hermite,
                                               // exposes only the display() method, which actually places and draws the shapes,
                                               // isolating that code so it can be experimented with on its own.
      init()
      {
        console.log("init")

        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
        // would be redundant to tell it again.  You should just re-use the
        // one called "box" more than once in display() to draw multiple cubes.
        // Don't define more than one blueprint for the same thing here.
        this.shapes = { 'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows() };

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }
        this.materials.particle = { shader: phong, ambient: 0.8, diffusivity: 0.4,  specularity: 0.1, color: color(0, 0, 1, 1) };
        this.materials.spring = { shader: phong, ambient: 0.6, diffusivity: 0.4,  specularity: 0.1, color: color(0.5, 0.5, 0.5, 1) };
        this.materials.grass = { shader: phong, ambient: 0.6, diffusivity: 0.5, specularity: 0.0, color: color(.9,.5,.9,1) };
        this.materials.collect = { shader: phong, ambient: 0.8, diffusivity: 0.4, specularity: 0.0, color: color(0.78, 0.31, 0.26, 1)}; // TODO definitely change this

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;

        // TODO: you should create the necessary shapes
        this.particles = [];
        this.springs = [];
        this.gravity = 9.8;
        this.ground_ks = 0;
        this.ground_kd = 0;
        this.dt = 0.01;
        this.integration = "euler";
        this.running = false;

        this.board = new Board(20, 1);
        this.grid_size = this.board.grid_size;
        this.cell_size = this.board.cell_size;

        this.collectibles = new Collectible(0.3, this.board.x_bounds, this.board.z_bounds, 3);
        // Current default setup has 3 collectibles on screen at once
        // Also I picked the radius at random

        this.game_over = false;
        this.score = 0;
        // Spawn head at the same place the animation wants at t=0
        const forward_speed = 2.0;
        const wave_freq = 4.0;
        const wave_amp = 0.4;
        const t0 = 0;

        const head0 = vec3(
          wave_amp * Math.sin(t0 * wave_freq),
          0.25,
          -8 + ((t0 * forward_speed) % 16)
        );

        // 5 particles, spacing 0.6
        this.starting_length = 5;
        this.snake = new Snake(this.starting_length, 0.6, head0);
      }

      render_animation( caller )
      {                                                // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Assign_one_hermite, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if( !caller.controls )
        { this.animated_children.push( caller.controls = new defs.Movement_Controls( { uniforms: this.uniforms } ) );
          caller.controls.add_mouse_controls( caller.canvas );

          // Define the global camera and projection matrices, which are stored in shared_uniforms.  The camera
          // matrix follows the usual format for transforms, but with opposite values (cameras exist as
          // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
          // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() or
          // orthographic() automatically generate valid matrices for one.  The input arguments of
          // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.

          // !!! Camera changed here
          Shader.assign_camera( Mat4.look_at (vec3 (0, 25, 0), vec3 (0, 0, 0), vec3 (0, 0, -1)), this.uniforms );
        }
        this.uniforms.projection_transform = Mat4.perspective( Math.PI/4, caller.width/caller.height, 1, 100 );

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = this.uniforms.animation_time/1000;
        const angle = Math.sin( t );

        // const light_position = Mat4.rotation( angle,   1,0,0 ).times( vec4( 0,-1,1,0 ) ); !!!
        // !!! Light changed here
        //const light_position = vec4(20 * Math.cos(angle), 20,  20 * Math.sin(angle), 1.0);
        const light_position = vec4(0, 100, 0, 0);
        this.uniforms.lights = [ defs.Phong_Shader.light_source( light_position, color( 1,1,1,1 ), 1000000 ) ];

        // draw axis arrows.
        //this.shapes.axis.draw(caller, this.uniforms, Mat4.identity(), this.materials.rgb);
      }
    }


export class Part_one_spring extends Part_one_spring_base
{                                                    // **Assign_one_hermite** is a Scene object that can be added to any display canvas.
                                                     // This particular scene is broken up into two pieces for easier understanding.
                                                     // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                     // The piece here exposes only the display() method, which actually places and draws
                                                     // the shapes.  We isolate that code so it can be experimented with on its own.
                                                     // This gives you a very small code sandbox for editing a simple scene, and for
                                                     // experimenting with matrix transformations.
  render_animation( caller )
  {                                                // display():  Called once per frame of animation.  For each shape that you want to
    // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
    // different matrix value to control where the shape appears.

    // Variables that are in scope for you to use:
    // this.shapes.box:   A vertex array object defining a 2x2x2 cube.
    // this.shapes.ball:  A vertex array object defining a 2x2x2 spherical surface.
    // this.materials.metal:    Selects a shader and draws with a shiny surface.
    // this.materials.plastic:  Selects a shader and draws a more matte surface.
    // this.lights:  A pre-made collection of Light objects.
    // this.hover:  A boolean variable that changes when the user presses a button.
    // shared_uniforms:  Information the shader needs for drawing.  Pass to draw().
    // caller:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().

    // Call the setup code that we left inside the base class:
    super.render_animation( caller );

    /**********************************
     Start coding down here!!!!
     **********************************/
        // From here on down it's just some example shapes drawn for you -- freely
        // replace them with your own!  Notice the usage of the Mat4 functions
        // translation(), scale(), and rotation() to generate matrices, and the
        // function times(), which generates products of matrices.

    const blue = color( 0,0,1,1 ), yellow = color( 1,1,0,1 ), grey = color( 0.5, 0.5, 0.5, 1 ), red = color( 1, 0, 0, 1 );

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    // let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    // this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
        .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    //this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );

    // TODO: you should draw spline here.

    // animation_delta_time is the time since the LAST frame (usually ~16ms)
    //let dt = this.uniforms.animation_delta_time / 1000;s
    let dt = 1/60; // use fixed timestep for more stable simulation, can be tweaked
    dt = Math.min(dt, 1/60);


    // Playing field:
    this.board.draw(caller, this.uniforms, this.shapes, this.materials);
    this.score = this.collectibles.score;
    document.getElementById("output").value = "Score: " + this.score;

    // Snake:
    if (!this.game_over) {
      this.snake.update(t, dt);  // optional animation (sine forward motion)
      const head_pos = this.snake.particles[0].pos;
      this.collectibles.update(t, head_pos);

      let length = this.snake.length;
      while (length < (this.score + this.starting_length)) {
        this.snake.addSegment();
        length++;
      }

      if (this.board.checkBorderCollision(head_pos))
        this.game_over = true;
      if (this.snake.checkSelfCollision())
        this.game_over = true;
    }
    this.snake.draw(caller, this.uniforms, this.shapes, this.materials);
    this.collectibles.draw(caller, this.uniforms, this.shapes, this.materials);
    
    /*if (this.running) {
      if (this.t_sim === undefined) this.t_sim = 0;
      const t_next = this.t_sim + dt;
 
      const t_step = this.dt;

      this.accumulator += dt;

      while (this.accumulator >= this.dt) {
        this.simulate(this.dt);
        this.t_sim += this.dt;
        this.accumulator -= this.dt;
      }
    }*/
    
    // DRAW
    /*for (let p of this.particles) {
      let matrix = Mat4.translation(p.pos[0], p.pos[1], p.pos[2])
                       .times(Mat4.scale(0.1, 0.1, 0.1));
      this.shapes.ball.draw(caller, this.uniforms, matrix, this.materials.particle);
    }*/

    /*r (let s of this.springs) {
      const p1 = this.particles[s.p1_i].pos;
      const p2 = this.particles[s.p2_i].pos;

      const delta = p2.minus(p1);
      const len = delta.norm();
      const center = (p1.plus(p2)).times(0.5);

      if (len < 0.001) continue;

      // y axis of spring, x axis = spring y axis (cross) world y axis
      const y_axis = delta.normalized();
      let x_axis = vec3(1, 0, 0).cross(y_axis);
      if (x_axis.norm() < 1e-6) x_axis = vec3(0, 0, 1).cross(y_axis); // Handle vertical case
      x_axis = x_axis.normalized();
      const z_axis = x_axis.cross(y_axis).normalized();

      const rotation = Mat4.of(
          [x_axis[0], y_axis[0], z_axis[0], 0],
          [x_axis[1], y_axis[1], z_axis[1], 0],
          [x_axis[2], y_axis[2], z_axis[2], 0],
          [0, 0, 0, 1]
      );

      let model_transform = Mat4.translation(center[0], center[1], center[2])
          .times(rotation)
          .times(Mat4.scale(0.02, len / 2, 0.02));

      this.shapes.box.draw(caller, this.uniforms, model_transform, this.materials.spring);
    }*/
  }

  // dedicated function for physics simulation
  simulate(h) {
    // reset forces on all particles
    for (let p of this.particles) p.f = vec3(0, 0, 0);

    // accumulate forces to determine how to move particle
    // -- gravity
    for (let p of this.particles) p.apply_force(vec3(0, -this.gravity * p.mass, 0));
    // -- springs
    for (let s of this.springs) s.update(this.particles);
    // -- ground
    for (let p of this.particles) {
      const surface_level = 0.15; 
      if (p.pos[1] < surface_level) {
        const penetration = surface_level - p.pos[1];
        
        // normal spring force (pushing up)
        let fy_spring = this.ground_ks * penetration;

        // damping force (vertical and horizontal)
        const floor_damping_factor = 1; // arbitrary factor to make it feel more realistic like example, can be tweaked
        let fx_friction = -this.ground_kd * p.vel[0];
        let fy_damping = -this.ground_kd * floor_damping_factor * p.vel[1];
        let fz_friction = -this.ground_kd * p.vel[2];

        const fx = fx_friction;
        const fy = fy_spring + fy_damping;
        const fz = fz_friction;

        p.apply_force(vec3(fx, fy, fz));

        //if particle is barely moving, apply additional damping to stop jittering on the ground like example
        if (p.vel.norm() < 0.05) {
            p.vel = vec3(p.vel[0] * 0.9, p.vel[1], p.vel[2] * 0.9);
        }
      }
    }

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

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Snake Controls:";
    this.new_line();
    this.key_triggered_button("Forward", ["ArrowUp"], () => this.snake.set_direction(vec3(0, 0, -1)));
    this.new_line();
    this.key_triggered_button("Backward", ["ArrowDown"], () => this.snake.set_direction(vec3(0, 0, 1)));
    this.new_line();
    this.key_triggered_button("Left", ["ArrowLeft"], () => this.snake.set_direction(vec3(-1, 0, 0)));
    this.new_line();
    this.key_triggered_button("Right", ["ArrowRight"], () => this.snake.set_direction(vec3(1, 0, 0)));
    this.new_line();
    this.key_triggered_button("Reset", ["r"], function() {
      this.game_over = false;
      const forward_speed = 2.0;
      const wave_freq = 4.0;
      const wave_amp = 0.4;
      const t0 = 0;

      const head0 = vec3(
        wave_amp * Math.sin(t0 * wave_freq),
        0.25,
        -8 + ((t0 * forward_speed) % 16)
      );

      // 5 particles, spacing 0.6
      this.snake = new Snake(6, 0.6, head0);
      this.collectibles = new Collectible(0.3, this.board.x_bounds, this.board.z_bounds, 3);
    });
    this.new_line();

    /* Some code for your reference
    this.key_triggered_button( "Copy input", [ "c" ], function() {
      let text = document.getElementById("input").value;
      console.log(text);
      document.getElementById("output").value = text;
    } );
    this.new_line();
    this.key_triggered_button( "Relocate", [ "r" ], function() {
      let text = document.getElementById("input").value;
      const words = text.split(' ');
      if (words.length >= 3) {
        const x = parseFloat(words[0]);
        const y = parseFloat(words[1]);
        const z = parseFloat(words[2]);
        this.ball_location = vec3(x, y, z)
        document.getElementById("output").value = "success";
      }
      else {
        document.getElementById("output").value = "invalid input";
      }
    } );
     */
  }

  parse_commands() {
    // Clear output
    document.getElementById("output").value = "";
    this.running = false;

    // Set up commands
    const one_word_commands = ["particle", "all_velocities", "link", "integration", "ground", "gravity"];

    // Get input and split it into lines
    const input_text = document.getElementById("input").value;
    const lines = input_text.split(/\r?\n/); //.map(l => l.trim()).filter(l => l.length > 0);

    // separate lines into words and parse commands
    for (let line of lines) {
      const words = line.trim().split(/\s+/);
      if (words.length == 0) document.getElementById("output").value = "empty line";

      let command = "";
      if (one_word_commands.includes(words[0])) command = words[0]
      else if (words[0] == "create") command = words[0] + ' ' + words[1];

      switch (command) {
        case "create particles": 
          const N = parseInt(words[2]);
          for (let i = 0; i < N; i++) {
            this.particles[i] = new Particle(vec3(0, 0, 0), vec3(0, 0, 0), 0);
          }
          break;
        case "particle": {
          const ind = parseInt(words[1]);
          const mass = parseFloat(words[2]);
          const x = parseFloat(words[3]);
          const y = parseFloat(words[4]);
          const z = parseFloat(words[5]);
          const vx = parseFloat(words[6]);
          const vy = parseFloat(words[7]);
          const vz = parseFloat(words[8]);
          const p = this.particles[ind];
          p.set_mass(mass);
          p.set_pos(vec3(x, y, z));
          p.set_vel(vec3(vx, vy, vz));
          //p.prev_pos = vec3(x, y, z).minus(vec3(vx, vy, vz).times(this.dt));
          break;
        }
        case "all_velocities": {
          const vx = parseFloat(words[1]);
          const vy = parseFloat(words[2]);
          const vz = parseFloat(words[3]);
          for (let p of this.particles) {
            p.set_vel(vec3(vx, vy, vz));
          }
          break;
        }
        case "create springs": {
          const N = parseInt(words[2]);
          this.springs = [];
          for (let i = 0; i < N; i++) {
            this.springs.push(new Spring());
          }
          break;
        }
        case "link": {
          const sind = parseInt(words[1]);
          const p1_i = parseInt(words[2]);
          const p2_i = parseInt(words[3]);
          const ks = parseFloat(words[4]);
          const kd = parseFloat(words[5]);
          const L = parseFloat(words[6]);
          const spring = this.springs[sind];
          const p1 = this.particles[p1_i];
          const p2 = this.particles[p2_i];

          if (L < 0) {
            const delta = (p2.pos).minus(p1.pos);
            let length = delta.norm();
            spring.set(p1_i, p2_i, ks, kd, length);
          } else {
            spring.set(p1_i, p2_i, ks, kd, L);
          }
          break;
        }
        case "integration": {
          const type = words[1];
          const h = parseFloat(words[2]);
          this.dt = h;
          if ((type != "euler") && (type != "symplectic") && (type != "verlet")) {
            document.getElementById("output").value = "unknown integration type";
          } else {
            this.integration = type;
          }
          break;
        }
        case "ground": {
          const ks = parseFloat(words[1]);
          const kd = parseFloat(words[2]);
          this.ground_ks = ks;
          this.ground_kd = kd;
          break;
        }
        case "gravity": {
          const g = parseFloat(words[1]);
          this.gravity = g;
          break;
        }
        default: 
          document.getElementById("output").value = "unknown command";
          break;
      }
    }

    document.getElementById("input").value = ""; // clear input after parsing
  }

  update_scene() { // callback for Draw button
    this.curve.update(this.webgl_manager, (t) => this.spline.evaluate(t));
    document.getElementById("output").value = "scene updated";
  }

  start() { // callback for Run button
    document.getElementById("output").value = "start";
    this.t_sim = this.uniforms.animation_time / 1000; // Match the engine clock exactly
    this.running = true;

    this.accumulator = 0;

    // initialize prev_pos
    for (let p of this.particles) {
      p.prev_pos = p.pos.minus(p.vel.times(this.dt));
    }
  }
}
