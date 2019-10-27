/*
Entities could be objects, players, world, background objects or sprites. They are the objects of the game. This class is abstract and can
only be instantiated by extending classes.
*/
export abstract class Entity{
  //All entities have the following properties:
  public x:number;
  public y:number;

  constructor(){ //Empty constructor
    this.x = 0;
    this.y = 0;
  }

}
