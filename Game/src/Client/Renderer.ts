/*
This class is for rendering the game into the browser. Responsible for turning entities into visible objects.
*/

//Use PIXI.js reference.
/// <reference path="../../node_modules/@types/pixi.js/index.d.ts"/>

import {World} from "../Common/World";
import {Entity} from "../Common/Entity";
import {RigidObject} from "../Common/RigidObject";
import {Vector2} from "../Common/Vector2";

export class Renderer {

  public readonly app:PIXI.Application;
  public readonly container:HTMLElement;
  private entityGraphicsLink:Map<Entity,PIXI.Graphics>;
  public readonly world:World;

  /** Create a new render object in the container element specified and the world given..*/
  constructor(container:HTMLElement,world:World){
    this.container = container; //Set the container field.
    this.world = world;
    this.entityGraphicsLink = new Map();

    //Log whether WebGL or canvas is being used.
    if (PIXI.utils.isWebGLSupported()){

      console.log("WebGL API is being used.");
      PIXI.utils.sayHello("WebGL");
    } else {
      console.log("Canvas API is being used.");
      PIXI.utils.sayHello("Canvas");
    }

    this.app = new PIXI.Application({
      width: 256,
      height: 256,
      backgroundColor: 16777215 //Solid white.
    });

    this.updateWindowToScreen(); //Resize the pixi renderer.

    window.addEventListener("resize",()=>{ //On parent element resize
      this.updateWindowToScreen(); //Resize
    });

    container.appendChild(this.app.view); //Add renderer to body.

    //Create an event listener for the world when entities are added.
    this.world.eventRegistry.addEventListener("addEntity",(ent:Entity)=>{
      console.log("Entity add event called!"); // TODO: Remove this in the future.

      let graphics:PIXI.Graphics = this.createGraphicsFromEntity(ent);

      this.entityGraphicsLink.set(ent,graphics); //Add to entity graphics mapping.

      this.app.stage.addChild(graphics); //Add the object to the stage.

    });

  }

  /**Update the canvas size to the parent element.*/
  public updateWindowToScreen():void{
    this.app.renderer.resize(this.container.offsetWidth,this.container.offsetHeight); //Resize to the offsetwidth and offsetheight of parent.
  }

  /**Create a pixi graphics object from an entity.*/
  private createGraphicsFromEntity(ent:Entity):PIXI.Graphics{
    if (ent instanceof RigidObject){ //Create graphics from RigidObject.
      let graphics:PIXI.Graphics = new PIXI.Graphics(); //Create new pixi graphics object.

      let nodeQueue:Array<Vector2> = []; //Create an empty queue of nodes.
      Object.assign(nodeQueue,ent.getWorldDrawmodel().nodes); //Copy the nodes from the drawmodel relative to the world.

      let firstPoint:Vector2 = this.resolveWorldCoordsToRender(nodeQueue.shift()); //Move to first node.
      graphics.moveTo(firstPoint.a,firstPoint.b); //Begin at this point.

      //TODO IMPLEMENT COLOURS AND OTHER STUFF:
      graphics.lineStyle(3,0x0000FF); //Blue 3px line.

      while (nodeQueue.length > 0){ //Process node queue.
        let currentPoint:Vector2 = this.resolveWorldCoordsToRender(nodeQueue.shift()); //Translate node into render size.
        graphics.lineTo(currentPoint.a,currentPoint.b); //Draw line to next point.
      }

      graphics.closePath(); //Close the path.

      return graphics;

    } else { //Unknown entity type.
      return undefined;
    }
  }

  /**Tansform the world coordinates into the render co-ordinates.*/
  public resolveWorldCoordsToRender(coords:Vector2):Vector2{
    let xMultiplier:number = this.app.renderer.width/this.world.sizeX; //Horizontal scale.
    let yMultiplier:number = this.app.renderer.height/this.world.sizeY; //Vertical scale.

    return new Vector2(coords.a*xMultiplier,coords.b*yMultiplier); //Return new coordinates multiplied by their respective scale factors.
  }

  /**Make a 100 by 100 square using the line and fill feature to see if everything works.*/
  public testSquare():void{
    let graphics:PIXI.Graphics = new PIXI.Graphics(); //New graphics object.
    graphics.lineStyle(3,3); //New line almost black.
    graphics.moveTo(25,25); //Lines
    graphics.lineTo(50,25);
    graphics.lineTo(50,50);
    graphics.lineTo(25,50);
    graphics.closePath(); //Finish path.
    this.app.stage.addChild(graphics); //Add to graphics
  }

}
