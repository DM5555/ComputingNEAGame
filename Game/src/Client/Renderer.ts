/*
This class is for rendering the game into the browser. Responsible for turning entities into visible objects.
*/

//Use PIXI.js reference.
/// <reference path="../../node_modules/@types/pixi.js/index.d.ts"/>

import {World} from "../Common/World";
import {Entity} from "../Common/Entity";
import {RigidObject} from "../Common/RigidObject";
import {Vector2} from "../Common/Vector2";
import {ClientFileLoader} from "./ClientFileLoader";

export class Renderer {

  public readonly app:PIXI.Application;
  public readonly container:HTMLElement;
  private entityGraphicsLink:Map<Entity,PIXI.Graphics>;
  public readonly world:World;
  private pixelsPerMetre:number;
  private cameraPosition:Vector2;

  private backgroundSprite:PIXI.Sprite; //Background image sprite.

  /** Create a new render object in the container element specified and the world given..*/
  constructor(container:HTMLElement,world:World){
    this.container = container; //Set the container field.
    this.world = world;
    this.entityGraphicsLink = new Map();
    this.pixelsPerMetre = 32; //Default zoom scale.
    this.cameraPosition = new Vector2(this.world.sizeX/2,this.world.sizeY/2); //Default camera posiiton si

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
  }

  /**Loads background and application size. Must be called after loadAssets. */
  public setup():void{
    this.loadBackgroundImage(); //Load the background image into the game.

    window.addEventListener("resize",()=>{ //On parent element resize
      this.updateWindowToScreen(); //Resize
    });

    this.container.appendChild(this.app.view); //Add renderer to body.


    //Create an event listener for the world when entities are added.
    this.world.eventRegistry.addEventListener("addEntity",(ent:Entity)=>{
      console.log("Entity add event called!"); // TODO: Remove this in the future.

      let graphics:PIXI.Graphics = this.createGraphicsFromEntity(ent);

      this.entityGraphicsLink.set(ent,graphics); //Add to entity graphics mapping.

      this.app.stage.addChild(graphics); //Add the object to the stage.

    });
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
    let cameraAdjustedCoords:Vector2 = new Vector2(coords.a-this.cameraPosition.a,coords.b-this.cameraPosition.b); //Adjust the position to the camera position.
    let uncenteredPos:Vector2 = new Vector2(cameraAdjustedCoords.a*this.pixelsPerMetre, cameraAdjustedCoords.b*this.pixelsPerMetre); //Adjust the position to actual pixel units.
    let screenPosition:Vector2 = new Vector2(uncenteredPos.a+this.app.renderer.width/2, uncenteredPos.b+this.app.renderer.height/2); //Adjust to the center of the screen.
    console.log("POS CHANGE: (" + coords.a + "," + coords.b + ") ("+screenPosition.a+","+screenPosition.b+")");
    return screenPosition;
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

  /** Load the background image as a sprite (requires loadAssets to be called first.). */
  private loadBackgroundImage():void{ //Asynchronously adds the background image.
    let backgroundTexture: PIXI.Texture = PIXI.utils.TextureCache["BackgroundImage"]; //Load background image from texture cache.
    this.backgroundSprite = new PIXI.Sprite(backgroundTexture); //Create a sprite.
    this.backgroundSprite.anchor.set(0.5,0.5); //Anchor the sprite's center to the center of the image.
    this.app.stage.addChild(this.backgroundSprite); //Add the sprite to the stage.

    this.updateWindowToScreen();
  }

  /**Update the canvas size to the parent element.*/
  private updateWindowToScreen():void{
    this.app.renderer.resize(this.container.offsetWidth,this.container.offsetHeight); //Resize to the offsetwidth and offsetheight of parent.

    this.backgroundSprite.position.set(this.app.renderer.width/2,this.app.renderer.height/2); //Set position to half of height and half width to center the image in the screen.
    this.backgroundSprite.scale.set(this.app.renderer.height/960,this.app.renderer.height/960); //Scale bound to height.
  }

  /**Load all of the game's assets for the renderer. */
  public loadAssets(fileLoader:ClientFileLoader):Promise<object>{
    return new Promise((resolve:(()=>void),reject:((err:any)=>void))=>{ //Create a promise object for the asset loader.
      fileLoader.loadJSONFile("resources").then((assetRegistry:object)=>{ //Load the asset registry.
        //Create a list of files to load.
        let assetQueue:object = {};
        for (let key of Object.keys(assetRegistry)){ //Index assets and add them to the queue.
          assetQueue[key] = 0; //Set status of asset to not
        }

        let assetsToProcess:number = Object.keys(assetQueue).length; //Store number of assets that need to be processed.

        console.log(assetQueue);
        for (let i of Object.keys(assetQueue)){ //Process the queue.
          PIXI.loader.add(i,"/static/game/src/resources/" + assetRegistry[i]).load(()=>{ //Load asset.
            assetQueue[i] = 1; //Register asset as loaded.
            assetsToProcess--; //Decrement counter of remaining assets.
            if (assetsToProcess === 0){ //Resoulve when the number of remaining assets hits 0.
              resolve();
            }
          });
        }
      }).catch((e:any)=>{ //Catch any errors.
        reject(e);
      });
    });
  }

  /**Get the current pixel to meter ratio.*/
  public getZoom():number{
    return this.pixelsPerMetre;
  }

  /**Get the current pixel to meter ratio.*/
  public setZoom(zoom:number):void{
    this.pixelsPerMetre = zoom;
  }
}
