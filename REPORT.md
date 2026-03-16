# Final Report: Snake Game

## Members:
Nathan Chen, David Kim, Jay Horsley, Xander Neary

## Project Description:
A three-dimensional adaptation of the classic “Snake” game, where the player controls a snake on a flat plane, attempting to collect consumable apples and avoid colliding with oneself or the edges of the board. New features, such as additional camera angles and obstacles, along with appealing graphics, have been added to take advantage of the 3D format.

### Algorithms Used:
- **Motion curves:** The movement of the snake will be controlled by motion curves for a smooth slithering motion. The direction of the snake’s head will be dictated by player input, with the rest of the body segments following the path of the head using a spline. 
Implemented in `game.js` and `snake.js` using a Math.sin function.
- **Behavioral animation:** The snake’s body will follow the head using snake-like behavior rules, so its movement looks smooth.
Implemented in `snake.js` by using a spring and particle chain-like system and dragging the head of the snake along the motion curve. 
- **Collision detection:** When the snake contacts an apple/food the player’s body increases. Game over when the snake hits the edge of the playing field or itself.
Implemented in `snake.js`, `board.js`, and `collect.js` by checking the distance between snake and border and between snake and apples.
- **Particle systems:** When the player picks up an item, a small burst of confetti or sparkle particles will appear, which will fall in accordance with gravity.
Implemented in `collect.js` as an array of positions and velocities in a ‘Sparkle’ class that generates random angles and shoots particles out in a firework-like explosion.

### Core Gameplay Loop
- The player starts in the top-down view with the snake spawning in at the top of the border. 
   - Can switch the perspective and movement system by pressing ‘1’ or ‘2’.
      1. Top-Down (Bird’s Eye) View, control the snake by pressing [‘UpArrow, ‘DownArrow’, ‘LeftArrow’, ‘RightArrow’]. Movement is absolute, aligned to the grid. 
      2. 3rd Person View, control the snake by pressing ‘LeftArrow’ and ‘RightArrow’. Movement is relative, allowing full 360 degree movement. 
- Maneuvering the head of the snake into an apple will increase the player’s score, add one additional segment to the snake (increasing its length), and increase the snake’s movement speed.
   - The player can pause/unpause the game at any time (if the game isn’t over) by pressing ‘p’. 
- Hitting the head into any obstacles, on the other hand, will end the game. 
   - The player can press the ‘r’ key to restart the game. 

### Features
- **Multiple view angles & motion controls:** Top-down view with “absolute” [up-right-left-down] movement controls and 3rd person view with “relative” [left-right] movement controls.
- **Food consumption:** If the snake head collides with an apple, it will eat the apple and the snake body will extend by one segment.
- **Collision:** Running into the obstacles on the board (like trees or rocks), the border (rock wall), or itself (the snake’s body) with the head will end the game. Body segments can collide with obstacles without ending the game, and will instead deflect around them naturally.
- **Score system:** Eating apples will increase the player’s score, while also increasing the movement speed and length of the snake.
- **Environment:** Multiple obstacles added in the scene like trees and rocks. Apples are floating at random points on the grid, respawning as the snake eats them. There are also grass particles across the playing board and clouds floating by overhead. 
- **Custom models:** The snake, apples, and most of the scene objects are all unique geometry modeled and textured in Blender, which were then imported to TinyGraphics.

## Challenges and Lessons Learned
- **Modeling:** One of the challenges that we encountered when creating the custom models was importing the OBJ files into tiny-graphics. Some models were not rendered properly in tiny-graphics because the model was not exported with the “Triangulate Faces” option. Another challenge was incorporating different colors/textures within one model (especially the tree and snake models), where textures would map awkwardly to the custom geometry, necessitating custom UV mappings between texture images and the model files. Additionally, there were some cases when the normal vectors of the model were not pointing the correct direction resulting in rendering issues in tiny-graphics, which were manually corrected by flipping the normal vectors inside Blender.
- **Particles:** Originally, the particle system was intended to be implemented using 2D sprites for each particle, similar to Three.js’s Point class, but this implementation is not supported by tinygraphics. Instead, the system had to be modified to use 3D geometry for particles, with the particle class written to simulate a system which tracks points.
- **Performance:** The real-time gameplay and reaction-time requirements as snake speed increases necessitates fairly smooth performance. This was a challenge when implementing the particle system and grass models, as the high number of added geometries created strain on the graphics engine, often causing frame drops. In third-person view, these problems were further exacerbated by the frequent changes in camera angle causing constant loading and unloading of objects. As a result, optimizations were made to reduce the number of particles displayed and to simplify the grass.The grass was originally implemented in Three.js, where instancing and rendering many repeated objects was more efficient. When adapting the project to TinyGraphics, performance became a greater concern, so the grass system had to be redesigned with fewer blades, simpler geometry, and randomized procedural placement to preserve the visual effect while keeping the game responsive.

## Next Steps
- **Mechanics:** Additional gameplay mechanics could be added to increase the complexity of the game, such as special collectibles which modify speed or invert controls.
- **Artificial intelligence:** The game could be modified to remove player control, with an algorithm instead controlling the snake’s behavior to simulate movement towards rewards and collision avoidance. Alternatively, such a life simulation algorithm could be implemented in a non-player controlled entity which exists as an additional challenge within the game.
- **Models:** The current model textures consist of a simple 2D texture image projected on a 3D model. More graphical enhancements could be made through displacement maps or increased model resolution, such as adding scales to the snake body, creating leaves for the tree models and indentations in the tree bark, and creating a rough surface for the rocks.

