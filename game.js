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
      }

      render_animation( caller )
      {                                                
        // set a background color for the canvas (red, green, blue, alpha)
        caller.context.clearColor(0.1, 0.4, 0.1, 0.35); 

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
    this.key_triggered_button("Forward", ["ArrowUp"], () => this.snake.setDirection(vec3(0, 0, -1)));
    this.new_line();
    this.key_triggered_button("Backward", ["ArrowDown"], () => this.snake.setDirection(vec3(0, 0, 1)));
    this.new_line();
    this.key_triggered_button("Left", ["ArrowLeft"], () => this.snake.setDirection(vec3(-1, 0, 0)));
    this.new_line();
    this.key_triggered_button("Right", ["ArrowRight"], () => this.snake.setDirection(vec3(1, 0, 0)));
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
