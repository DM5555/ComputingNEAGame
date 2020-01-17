/*
Entities could be objects, players, world, background objects or sprites. They are the objects of the game. This class is abstract and can
only be instantiated by extending classes.
*/
import {Vector2} from "./Vector2";

export abstract class Entity{
  //All entities have the following properties:
  public position:Vector2;
  public rotation:number; //Rotation. Measured in radians.

  constructor(pos:Vector2){ //Empty constructor
    this.position = pos;
  }

}
