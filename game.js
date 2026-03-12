import {tiny, defs} from './examples/common.js';
import { Snake } from "./snake.js";
// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;
import { Grass_Blade } from "./tiny_grass.js";
// TODO: you should implement the required classes here or in another file.
import {Board} from "./board.js"
import { Collectible } from './collect.js';
import { Obstacle } from "./obstacle.js";

export
const GameBase = defs.GameBase =
    class GameBase extends Component
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
          'axis' : new defs.Axis_Arrows(),
          'tree1' : new defs.Shape_From_File("assets/obstacles/tree1.obj"),
          'rock1' : new defs.Shape_From_File("assets/obstacles/rock1.obj"),
          'rock2' : new defs.Shape_From_File("assets/obstacles/rock2.obj"),
          'grass_blade': new Grass_Blade(6, 0.10, 0.45, 0.12),
          'rock_1': new defs.Shape_From_File("assets/Rocks/Rock Type1 01/Rock Type1 01.obj"),
          'rock_2': new defs.Shape_From_File("assets/Rocks/Rock Type1 02/Rock Type1 02.obj"),
          'rock_3': new defs.Shape_From_File("assets/Rocks/Rock Type1 03/Rock Type1 03.obj"),
          'rock_4': new defs.Shape_From_File("assets/Rocks/Rock Type1 04/Rock Type1 04.obj"),
          // Type 1
          'rock_1_01': new defs.Shape_From_File("assets/Rocks/Rock Type1 01/Rock Type1 01.obj"),
          'rock_1_02': new defs.Shape_From_File("assets/Rocks/Rock Type1 02/Rock Type1 02.obj"),
          'rock_1_03': new defs.Shape_From_File("assets/Rocks/Rock Type1 03/Rock Type1 03.obj"),
          'rock_1_04': new defs.Shape_From_File("assets/Rocks/Rock Type1 04/Rock Type1 04.obj"),

          // Type 2
          'rock_2_01': new defs.Shape_From_File("assets/Rocks/Rock Type2 01/Rock Type2 01.obj"),
          'rock_2_02': new defs.Shape_From_File("assets/Rocks/Rock Type2 02/Rock Type2 02.obj"),
          'rock_2_03': new defs.Shape_From_File("assets/Rocks/Rock Type2 03/Rock Type2 03.obj"),
          'rock_2_04': new defs.Shape_From_File("assets/Rocks/Rock Type2 04/Rock Type2 04.obj"),

          // Type 3
          'rock_3_01': new defs.Shape_From_File("assets/Rocks/Rock Type3 01/Rock Type3 01.obj"),
          'rock_3_02': new defs.Shape_From_File("assets/Rocks/Rock Type3 02/Rock Type3 02.obj"),
          'rock_3_03': new defs.Shape_From_File("assets/Rocks/Rock Type3 03/Rock Type3 03.obj"),
          'rock_3_04': new defs.Shape_From_File("assets/Rocks/Rock Type3 04/Rock Type3 04.obj"),

          // Type 4
          'rock_4_01': new defs.Shape_From_File("assets/Rocks/Rock Type4 01/Rock Type4 01.obj"),
          'rock_4_02': new defs.Shape_From_File("assets/Rocks/Rock Type4 02/Rock Type4 02.obj"),
          'rock_4_03': new defs.Shape_From_File("assets/Rocks/Rock Type4 03/Rock Type4 03.obj"),
          'rock_4_04': new defs.Shape_From_File("assets/Rocks/Rock Type4 04/Rock Type4 04.obj"),

          // Type 5
          'rock_5_01': new defs.Shape_From_File("assets/Rocks/Rock Type5 01/Rock Type5 01.obj"),
          'rock_5_02': new defs.Shape_From_File("assets/Rocks/Rock Type5 02/Rock Type5 02.obj"),
          'rock_5_03': new defs.Shape_From_File("assets/Rocks/Rock Type5 03/Rock Type5 03.obj"),
          'rock_5_04': new defs.Shape_From_File("assets/Rocks/Rock Type5 04/Rock Type5 04.obj"),

          // Type 6
          'rock_6_01': new defs.Shape_From_File("assets/Rocks/Rock Type6 01/Rock Type6 01.obj"),
          'rock_6_02': new defs.Shape_From_File("assets/Rocks/Rock Type6 02/Rock Type6 02.obj"),
          'rock_6_03': new defs.Shape_From_File("assets/Rocks/Rock Type6 03/Rock Type6 03.obj"),
          'rock_6_04': new defs.Shape_From_File("assets/Rocks/Rock Type6 04/Rock Type6 04.obj"),
          
         };

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
        this.materials.tree1 = { shader: tex_phong, ambient: 1, diffusivity: 0.5, specularity: 0.5, texture: new Texture("assets/obstacles/tree1_texture.png") };
        this.materials.rock = { shader: phong, ambient: 0.4, diffusivity: 0.9, specularity: 0.1, color: color(0.5, 0.5, 0.5, 1) };

        // Cloud material
        this.materials.cloud = {
          shader: phong,
          ambient: 0.95,
          diffusivity: 0.2,
          specularity: 0.0,
          color: color(1, 1, 1, 1)
        };

        // Far cloud material
        this.materials.far_cloud = {
          shader: phong,
          ambient: 0.95,
          diffusivity: 0.1,
          specularity: 0.0,
          color: color(1, 1, 1, 0.35)
        };

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;

        this.particles = [];
        this.springs = [];
        this.gravity = 9.8;
        this.ground_ks = 0;
        this.ground_kd = 0;
        this.dt = 0.01;
        this.integration = "euler";
        this.running = false;
        this.camera_follow_snake = false;

        this.board = new Board(20, 1);
        this.grid_size = this.board.grid_size;
        this.cell_size = this.board.cell_size;

        // Current default setup has 3 collectibles on screen at once
        // Also I picked the radius at random
        this.game_over = false;
        this.score = 0;
        // Spawn head at the same place the animation wants at t=0
        const starting_speed = 2.0;
        const wave_freq = 5.0;
        const wave_amp = 0.4;
        const t0 = 0;

        const head0 = vec3(
          wave_amp * Math.sin(t0 * wave_freq),
          0.25,
          -8 + ((t0 * starting_speed) % 16)
        );

        this.starting_length = 5;
        const particle_distance = 0.6;
        
        this.obstacles = new Obstacle(0.3, this.board.x_bounds, this.board.z_bounds, 5, head0);
        this.collectibles = new Collectible(0.3, this.board.x_bounds, this.board.z_bounds, 3, this.obstacles.instances);
        this.snake = new Snake(this.starting_length, starting_speed, particle_distance, head0);

        this.accumulated_time = 0;

        // Cloud settings
        this.moving_clouds = [
          {
            angle_offset: 0.0,
            height: 9.5,
            radius_x: 26,
            radius_z: 18,
            speed: 0.030,
            wobble: 0.20,
            scale: 1.5,
            cluster_type: 0,
            center: vec3(0, 0, 0)
          },
          {
            angle_offset: 1.4,
            height: 11.0,
            radius_x: 31,
            radius_z: 22,
            speed: 0.022,
            wobble: 0.15,
            scale: 1.9,
            cluster_type: 1,
            center: vec3(2, 0, -3)
          },
          {
            angle_offset: 2.7,
            height: 8.7,
            radius_x: 20,
            radius_z: 28,
            speed: 0.027,
            wobble: 0.18,
            scale: 1.4,
            cluster_type: 2,
            center: vec3(-4, 0, 1)
          },
          {
            angle_offset: 4.2,
            height: 10.5,
            radius_x: 36,
            radius_z: 16,
            speed: 0.018,
            wobble: 0.12,
            scale: 2.0,
            cluster_type: 3,
            center: vec3(3, 0, 4)
          },
          {
            angle_offset: 5.1,
            height: 9.0,
            radius_x: 24,
            radius_z: 24,
            speed: 0.025,
            wobble: 0.14,
            scale: 1.7,
            cluster_type: 1,
            center: vec3(-2, 0, -5)
          },
          {
            angle_offset: 3.5,
            height: 12.0,
            radius_x: 42,
            radius_z: 30,
            speed: 0.014,
            wobble: 0.10,
            scale: 2.2,
            cluster_type: 4,
            center: vec3(0, 0, 0)
          }
        ];

        this.stationary_clouds = [
          { pos: vec3(-70, 18, -58), scale: 4.5, cluster_type: 4 },
          { pos: vec3(82, 20, -52), scale: 5.2, cluster_type: 3 },
          { pos: vec3(-88, 22, 60), scale: 5.8, cluster_type: 2 },
          { pos: vec3(95, 19, 70), scale: 4.9, cluster_type: 1 },
          { pos: vec3(0, 24, -92), scale: 6.0, cluster_type: 4 },
          { pos: vec3(-40, 21, 96), scale: 5.0, cluster_type: 0 },
          { pos: vec3(48, 23, 102), scale: 5.6, cluster_type: 2 }
        ];
      }

      draw_cloud_cluster(caller, uniforms, center, scale_factor, cluster_type, material)
      {
        let puffs = [];

        if (cluster_type === 0) {
          puffs = [
            { x: 0.0,  y: 0.0,  z: 0.0,  sx: 2.5, sy: 1.2, sz: 1.4 },
            { x: 2.0,  y: 0.4,  z: 0.2,  sx: 1.9, sy: 1.0, sz: 1.2 },
            { x: -1.9, y: 0.2,  z: -0.1, sx: 1.8, sy: 1.0, sz: 1.1 },
            { x: 0.3,  y: 0.7,  z: 0.0,  sx: 1.7, sy: 1.05, sz: 1.15 }
          ];
        }
        else if (cluster_type === 1) {
          puffs = [
            { x: -2.6, y: 0.0,  z: 0.1,  sx: 1.6, sy: 0.9, sz: 1.0 },
            { x: -0.8, y: 0.5,  z: 0.0,  sx: 2.1, sy: 1.2, sz: 1.3 },
            { x: 1.2,  y: 0.6,  z: -0.2, sx: 2.3, sy: 1.1, sz: 1.4 },
            { x: 3.1,  y: 0.1,  z: 0.2,  sx: 1.7, sy: 0.9, sz: 1.0 },
            { x: 0.8,  y: 1.0,  z: 0.1,  sx: 1.4, sy: 0.9, sz: 1.0 }
          ];
        }
        else if (cluster_type === 2) {
          puffs = [
            { x: 0.0,  y: 0.0,  z: 0.0,  sx: 2.8, sy: 1.0, sz: 1.1 },
            { x: -2.1, y: 0.1,  z: -0.3, sx: 1.6, sy: 0.8, sz: 0.9 },
            { x: 2.2,  y: 0.15, z: 0.2,  sx: 1.7, sy: 0.85, sz: 0.95 },
            { x: -0.7, y: 0.55, z: 0.0,  sx: 1.3, sy: 0.9, sz: 1.0 },
            { x: 0.9,  y: 0.5,  z: 0.0,  sx: 1.25, sy: 0.85, sz: 0.95 }
          ];
        }
        else if (cluster_type === 3) {
          puffs = [
            { x: -3.0, y: 0.1,  z: 0.0,  sx: 1.5, sy: 0.85, sz: 0.95 },
            { x: -1.3, y: 0.8,  z: 0.1,  sx: 1.8, sy: 1.0, sz: 1.1 },
            { x: 0.6,  y: 1.0,  z: -0.1, sx: 2.2, sy: 1.15, sz: 1.25 },
            { x: 2.7,  y: 0.5,  z: 0.2,  sx: 1.9, sy: 1.0, sz: 1.15 },
            { x: 4.2,  y: 0.0,  z: 0.0,  sx: 1.4, sy: 0.8, sz: 0.9 }
          ];
        }
        else {
          puffs = [
            { x: -3.4, y: 0.2,  z: -0.2, sx: 1.7, sy: 0.95, sz: 1.0 },
            { x: -1.6, y: 0.9,  z: 0.0,  sx: 2.0, sy: 1.1, sz: 1.2 },
            { x: 0.2,  y: 1.15, z: 0.0,  sx: 2.4, sy: 1.2, sz: 1.35 },
            { x: 2.3,  y: 0.9,  z: 0.1,  sx: 2.0, sy: 1.05, sz: 1.2 },
            { x: 4.1,  y: 0.25, z: 0.0,  sx: 1.6, sy: 0.9, sz: 1.0 },
            { x: 0.6,  y: 1.8,  z: 0.0,  sx: 1.5, sy: 0.95, sz: 1.05 }
          ];
        }

        for (const puff of puffs) {
          const puff_transform =
            Mat4.translation(
              center[0] + puff.x * scale_factor,
              center[1] + puff.y * scale_factor,
              center[2] + puff.z * scale_factor
            ).times(
              Mat4.scale(
                puff.sx * scale_factor,
                puff.sy * scale_factor,
                puff.sz * scale_factor
              )
            );

          this.shapes.ball.draw(caller, uniforms, puff_transform, material);
        }
      }

      draw_clouds(caller, uniforms)
      {
        const t = uniforms.animation_time / 1000;

        for (const cloud of this.moving_clouds) {
          const angle = t * cloud.speed + cloud.angle_offset;

          const x = cloud.center[0] + cloud.radius_x * Math.cos(angle);
          const z = cloud.center[2] + cloud.radius_z * Math.sin(angle * 0.9 + cloud.angle_offset * 0.2);
          const y = cloud.height + cloud.wobble * Math.sin(angle * 2.1);

          this.draw_cloud_cluster(
            caller,
            uniforms,
            vec3(x, y, z),
            cloud.scale,
            cloud.cluster_type,
            this.materials.cloud
          );
        }

        for (const cloud of this.stationary_clouds) {
          this.draw_cloud_cluster(
            caller,
            uniforms,
            cloud.pos,
            cloud.scale,
            cloud.cluster_type,
            this.materials.far_cloud
          );
        }
      }

      render_animation( caller )
      {                                                
        // set a background color for the canvas (red, green, blue, alpha)
        caller.context.clearColor(0.53, 0.81, 0.98, 1.0);

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
          Shader.assign_camera( Mat4.look_at (vec3 (0, 34, 0), vec3 (0, 0, 0), vec3 (0, 0, -1)), this.uniforms );
        }
        this.uniforms.projection_transform = Mat4.perspective( Math.PI/4, caller.width/caller.height, 1, 180 );

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


export class Game extends GameBase
{                                                    
  render_animation( caller )
  {                                               
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

    // Animation time: 
      // animation_time is the total time since the program started, in milliseconds
      // animation_delta_time is the time since the LAST frame (usually ~16ms)
    let dt = this.uniforms.animation_delta_time / 1000;

    // Clouds:
    this.draw_clouds(caller, this.uniforms);

    // Playing field:
    this.board.draw(caller, this.uniforms, this.shapes, this.materials);
    this.score = this.collectibles.score;
    if (!this.game_over) {
      document.getElementById("current-score").textContent = this.score;
      document.getElementById("current-speed").textContent = this.snake.speed.toFixed(1);
    }

    // Snake:
    if (!this.game_over) {
      let timestep = 0;
      while (timestep < dt) {
        this.snake.update(this.t, dt);
        timestep++;
      }
      //this.snake.update(t, dt);  // optional animation (sine forward motion)
      const head_pos = this.snake.particles[0].pos;
      if (this.camera_follow_snake) {
        Shader.assign_camera( Mat4.look_at (head_pos.plus(this.snake.current_direction.times(-10)).plus(vec3(0, 2, 0)), 
                                            head_pos.plus(this.snake.current_direction.times(10)).plus(vec3(0, 2, 0)), 
                                            vec3 (0, 1, 0)), 
                                            this.uniforms );
      } else {
        Shader.assign_camera(
          Mat4.look_at(vec3(0, 34, 0), vec3(0, 0, 0), vec3(0, 0, -1)),
          this.uniforms );
      }
      this.collectibles.update(this.t, head_pos);

      let length = this.snake.length;
      while (length < (this.score + this.starting_length)) {
        this.snake.addSegment();
        this.snake.increaseSpeed(0.5); // increase forward speed slightly every time we eat a collectible, can be tweaked
        length++;
      }

      if (this.obstacles.checkCollision(head_pos)) {
        //document.getElementById("output").value = "You hit an obstacle! Game Over! Final Score: " + this.score;
        this.game_over = true;
      }
      if (this.board.checkBorderCollision(head_pos)) {
        //document.getElementById("output").value = "You hit the border! Game Over! Final Score: " + this.score;
        this.game_over = true;
      }
      if (this.snake.checkSelfCollision()) {
        //document.getElementById("output").value = "You hit yourself! Game Over! Final Score: " + this.score;
        this.game_over = true;
      }
    } else {
      const gameOverUI = document.getElementById("game-over-screen");
      if (gameOverUI && gameOverUI.style.display != "flex") {
        gameOverUI.style.display = "block";
        document.getElementById("final-score").textContent = this.score;
      }
    }

    this.snake.draw(caller, this.uniforms, this.shapes, this.materials);
    this.collectibles.draw(caller, this.uniforms, this.shapes, this.materials);
    this.obstacles.draw(caller, this.uniforms, this.shapes, this.materials);
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Snake Controls:";
    this.new_line();
    this.key_triggered_button("Forward", ["ArrowUp"], () => this.snake.setDirection(vec3(0, 0, -1), this.camera_follow_snake, false));
    this.new_line();
    this.key_triggered_button("Backward", ["ArrowDown"], () => this.snake.setDirection(vec3(0, 0, 1), this.camera_follow_snake, false));
    this.new_line();
    this.key_triggered_button("Left", ["ArrowLeft"], () => this.snake.setDirection(vec3(-1, 0, 0), this.camera_follow_snake, true));
    this.new_line();
    this.key_triggered_button("Right", ["ArrowRight"], () => this.snake.setDirection(vec3(1, 0, 0), this.camera_follow_snake, false));
    this.new_line();
    this.key_triggered_button("Reset", ["r"], function() {
      this.game_over = false;
      const forward_speed = 2.0;
      const wave_freq = 5.0;
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
    this.key_triggered_button("Top-down view", ["1"], () => {
      this.camera_follow_snake = false;
    });
    this.new_line();
    this.key_triggered_button("Follow snake", ["2"], () => {
      this.camera_follow_snake = true;
    });
    this.new_line();
  }

  update_scene() { // callback for Draw button
    this.curve.update(this.webgl_manager, (t) => this.spline.evaluate(t));
    //document.getElementById("output").value = "scene updated";
  }

  start() { // callback for Run button
    //document.getElementById("output").value = "start";
    this.t_sim = this.uniforms.animation_time / 1000; // Match the engine clock exactly
    this.running = true;

    this.accumulator = 0;

    // initialize prev_pos
    for (let p of this.particles) {
      p.prev_pos = p.pos.minus(p.vel.times(this.dt));
    }
  }
}