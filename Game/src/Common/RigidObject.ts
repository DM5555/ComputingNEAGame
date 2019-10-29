/*
This class is for solid objects with a hitbox and a shape. These objects cannot be deformed.
*/
import {Entity} from "./Entity";
import {BoundingBox} from "./BoundingBox";
import {Vector2} from "./Vector2";

export class RigidObject extends Entity {
  public readonly hitbox:BoundingBox;
  public readonly drawmodel:BoundingBox;

  /**Create a new rigit object entity.*/
  constructor(hitbox:BoundingBox, drawmodel:BoundingBox, position:Vector2){
    super(position);
    this.hitbox = hitbox;
    this.drawmodel = drawmodel;
  }


}
