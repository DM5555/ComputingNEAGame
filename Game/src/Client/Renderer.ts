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
  private entityDisplayLink:Map<Entity,PIXI.DisplayObject>;
  public readonly world:World;
  private pixelsPerMetre:number;
  private scaleFactor:number;
  private _zoom:number;
  private cameraPosition:Vector2;
  private frameCount:number;

  private backgroundSprites:[PIXI.Sprite,PIXI.Sprite,PIXI.Sprite]; //Background image sprites.

  /** Create a new render object in the container element specified and the world given..*/
  constructor(container:HTMLElement,world:World){
    this.container = container; //Set the container field.
    this.world = world;
    this.entityDisplayLink = new Map();
    this._zoom = 1; //Default zoom scale.
    this.scaleFactor = 32;
    this.updatePPM(); //Set pixels per metre ratio.
    this.cameraPosition = new Vector2(this.world.sizeX/2,this.world.sizeY/2); //Default camera posiiton.
    this.frameCount = 0;


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

      if (ent instanceof RigidObject){

        let texture:PIXI.Texture = new PIXI.Texture(PIXI.utils.TextureCache[(<RigidObject>ent).getTextureName()]);

        let objectbounds:[number,number,number,number] = this.getRigidObjectDisplayBounds(ent);
        let squareWidth:number = Math.abs(objectbounds[3]-objectbounds[1]);
        let squareHeight:number = Math.abs(objectbounds[2]-objectbounds[0]);
        let tilingSprite:PIXI.extras.TilingSprite = new PIXI.extras.TilingSprite(texture,squareWidth*512,squareHeight*512); //Create a tiling sprite.
        tilingSprite.scale.set(1/512,1/512); //Scale it down to 1/8th because the texture will be 64*64.
        tilingSprite.anchor.set(0,0);

        tilingSprite.pivot.set(tilingSprite.width/2,tilingSprite.height/2);
        this.entityDisplayLink.set(ent,tilingSprite); //Add to entity graphics mapping.

        this.app.stage.addChild(tilingSprite); //Add the object to the stage.
      }

    });

    window.requestAnimationFrame(()=>{this.animate()}); //Begin animation looping.


  }

  /**Get the square limits of a rigid object (not including rotation). Order: NESW*/
  private getRigidObjectDisplayBounds(ent:RigidObject):[number,number,number,number]{
    let north:number = 0;
    let east:number = 0;
    let south:number = 0;
    let west:number = 0;

    ent.drawmodel.nodes.forEach((node:Vector2)=>{ //Index all nodes; Find boundaries.
      if (node.a > east){
        east = node.a;
      }
      if (node.a < west){
        west = node.a;
      }
      if (node.b > south){
        south = node.b
      }
      if (node.b < north){
        north = node.b;
      }
    });

    return [north,east,south,west];
  }

  /**Main animation loop. Calls recursively.*/
  public animate():void{

    this.entityDisplayLink.forEach((displayObject:PIXI.DisplayObject,entity:Entity)=>{ //TODO: Avoid updating things when they don't need to in order to optimise.
      if (entity instanceof RigidObject){ //Divide the scale by 512 if it is a rigid object because of the texture size.
        displayObject.scale.set(this.pixelsPerMetre/512,this.pixelsPerMetre/512);

      } else {
        displayObject.scale.set(this.pixelsPerMetre,this.pixelsPerMetre);
      }
      let objectPosition:Vector2 = this.resolveWorldCoordsToRender(entity.position);

      if (displayObject instanceof PIXI.Sprite){ //Offset coordinates for sprites.
          objectPosition.a+=(displayObject.width*displayObject.scale.x)/2;
          objectPosition.b+=(displayObject.height*displayObject.scale.y)/2;
      }
      displayObject.position.set(objectPosition.a,objectPosition.b);
      displayObject.rotation = entity.rotation;
    });

    for(let i:number=0; i<this.backgroundSprites.length; i++){ //Index background sprites.
      let bgSprite:PIXI.Sprite = this.backgroundSprites[i];
      let x:number = bgSprite.position.x;
      let y:number = this.app.renderer.height/2; //Set y position to vertical center of the screen.

      x = this.app.renderer.width/2 + ((this.world.sizeX/2-this.cameraPosition.a)*(2**i)); //Parallax view.

      bgSprite.position.set(x,y); //Update position.

    }

    window.requestAnimationFrame(()=>{this.animate()}); //Recursively request another frame.
    this.app.renderer.render(this.app.stage);
    this.frameCount++;
  }

  /**Create a pixi graphics object from an entity.*/
  private createGraphicsFromEntity(ent:Entity):PIXI.Graphics{
    if (ent instanceof RigidObject){ //Create graphics from RigidObject.
      let graphics:PIXI.Graphics = new PIXI.Graphics(); //Create new pixi graphics object.

      let nodeQueue:Array<Vector2> = []; //Create an empty queue of nodes.
      Object.assign(nodeQueue,ent.getWorldDrawmodel().nodes); //Copy the nodes from the drawmodel relative to the world.



      let firstPoint:Vector2 = nodeQueue.shift(); //Move to first node.
      graphics.moveTo(firstPoint.a,firstPoint.b); //Begin at this point.

      graphics.lineStyle(0); //No line.
      graphics.beginFill(0x000000);


      while (nodeQueue.length > 0){ //Process node queue.
        let currentPoint:Vector2 = nodeQueue.shift(); //Shift next point from queue.
        graphics.lineTo(currentPoint.a,currentPoint.b); //Draw line to next point.
      }

      graphics.endFill();

      let graphicsPosition:Vector2 = this.resolveWorldCoordsToRender(ent.position); //Get adjusted position for the graphics object.

      graphics.position.set(graphicsPosition.a,graphicsPosition.b); //Set the position.
      graphics.scale.set(this.pixelsPerMetre,this.pixelsPerMetre);

      console.log(graphicsPosition.a,graphicsPosition.b);

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
    //let backgroundTexture: PIXI.Texture = PIXI.utils.TextureCache["BackgroundImage"]; //Load background image from texture cache.
    let backgroundFar:PIXI.Texture = PIXI.utils.TextureCache["BackgroundFar"]; //Far background.
    let backgroundMid:PIXI.Texture = PIXI.utils.TextureCache["BackgroundMid"]; //Mid background.
    let backgroundClose:PIXI.Texture = PIXI.utils.TextureCache["BackgroundClose"]; //Close background.
    //Creaqte sprites
    this.backgroundSprites = [new PIXI.Sprite(backgroundFar),new PIXI.Sprite(backgroundMid),new PIXI.Sprite(backgroundClose)];

    for (let sprite of this.backgroundSprites){
      sprite.anchor.set(0.5,0.5); //Set sprite anchor to center;
      this.app.stage.addChild(sprite); //Add the sprite to the stage.
    }

    this.updateWindowToScreen();
  }

  /**Update the canvas size to the parent element.*/
  private updateWindowToScreen():void{
    this.app.renderer.resize(Math.min(this.container.offsetWidth,this.container.offsetHeight*(7/3)),this.container.offsetHeight); //Resize to the offsetwidth and offsetheight of parent. Limit aspect ratio to 7:3

    for(let sprite of this.backgroundSprites){ //Scale sprites.
      sprite.scale.set(this.app.renderer.height/960,this.app.renderer.height/960); //Scale bound to height.
    }

    this.scaleFactor = this.container.offsetHeight/32;
    this.updatePPM();
  }

  /**Load all of the game's assets for the renderer. */
  public loadAssets(fileLoader:ClientFileLoader):Promise<object>{
    return new Promise((resolve:(()=>void),reject:((err:any)=>void))=>{ //Create a promise object for the asset loader.
      fileLoader.loadJSONFile("resources").then((assetRegistry:object)=>{ //Load the asset registry.

        for (let i of Object.keys(assetRegistry)){ //Process the queue.
          PIXI.loader.add(i,"/static/game/src/resources/" + assetRegistry[i]);
        }

        PIXI.loader.load(()=>{ //Actually load the assets now.
          resolve();
        });
      }).catch((e:any)=>{ //Catch any errors.
        reject(e);
      });
    });
  }

  get zoom():number{
    return this._zoom;
  }

  set zoom(z:number){
    this._zoom = z;
    this.updatePPM();
  }

  /**Update pixels per metre ratio.*/
  private updatePPM():void{
    this.pixelsPerMetre = this._zoom*this.scaleFactor;
  }

  /**Get camera position. */
  public getCameraPosition():Vector2{
    return new Vector2(this.cameraPosition.a,this.cameraPosition.b); //Safely clone the object.
  }

  /**Set camera position. */
  public setCameraPosition(pos:Vector2):void{
    this.cameraPosition.a = pos.a;
    this.cameraPosition.b = pos.b;
  }
}
