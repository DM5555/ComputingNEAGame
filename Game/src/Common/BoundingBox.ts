/*
This class is simply a list of node of an object. This could be the draw shape or the hitbox.
*/
import {Vector2} from "./Vector2";

export class BoundingBox {

  public nodes:Vector2[]; //This is the list of points of the bounding box. This is publicly accessible.

  constructor(nodes?:Vector2[]){ //Create a new bounding box with the nodes in order so that the box is in that shape.
    this.nodes = []; //Create new node list.
    Object.assign(this.nodes,nodes); //Copy nodes across to the object nodes from the ones passed in the constructor.
  }

}
