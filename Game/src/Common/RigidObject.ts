/*
This class is for solid objects with a hitbox and a shape. These objects cannot be deformed.
*/
import {Entity} from "./Entity";
import {BoundingBox} from "./BoundingBox";
import {Vector2} from "./Vector2";
import {DGEventListenerRegistry} from "./DGEventListenerRegistry";

export class RigidObject extends Entity {
  public readonly hitbox:BoundingBox;
  public readonly drawmodel:BoundingBox;
  public velocity:Vector2; //Velocity of object.
  public oldPosition:Vector2; //Position object prior to move. Used to smooth out movement when rendering.
  public readonly eventRegistry:DGEventListenerRegistry;
  private textureName:string;
  private textureScale:number;

  /**Create a new rigit object entity.*/
  constructor(hitbox:BoundingBox, drawmodel:BoundingBox, position:Vector2, velocity:Vector2, textureName?:string){
    super(position);
    this.hitbox = hitbox;
    this.drawmodel = drawmodel;
    this.velocity = velocity;
    this.eventRegistry = new DGEventListenerRegistry();
    if (typeof textureName === "undefined"){
      this.textureName = "DefaultTexture"
    } else {
      this.textureName = textureName;
    }
  }

  /**Get the drawmodel of an object relative to the world, not to the centre of mass for the object.*/
  public getWorldDrawmodel():BoundingBox{
    let worldDrawmodel:BoundingBox = new BoundingBox(); //Create new boundingbox.
    for (let n of this.drawmodel.nodes){ //Index nodes.
      worldDrawmodel.nodes.push(new Vector2( //Add nodes with their relative positions to the world.
        n.a,
        n.b
      ));
    }
    return worldDrawmodel;
  }

  public getTextureName():string{
    return this.textureName;
  }

  public setTextureName(textureName:string){
    this.textureName = textureName;
    this.eventRegistry.dispatchEvent("TextureChange",textureName);
  }

}
