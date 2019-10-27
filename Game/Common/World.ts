/*
This is the class where infomration about the environment will be stored. This will include things such as entities, level data,
collision groups, etc...
*/
import {CollisionGroup} from "./CollisionGroup";
import {Entity} from "./Entity";

export class World{
  private collisionGroups: CollisionGroup[]; //This is a dynamic list of collision groups.
  private entities:Entity[]; //All of the entities in the world.
  public readonly sizeX:number; //World size in x.
  public readonly sizeY:number; //World size in y.

  constructor(sizeX:number, sizeY:number){ //Create a new world with the given dimensions.
    this.sizeX = sizeX;
    this.sizeY = sizeY;
  }

  public addCollisionGroup():void{ //Create and add a collision group to the list. Collision groups belong to the world instance.
    let cg:CollisionGroup = new CollisionGroup();
    this.collisionGroups.push(cg);
  }

  public removeCollisionGroup(cg:CollisionGroup):boolean{ //Remove a collisiongroup from the list. Will probably be redundant.
    let index:number = this.collisionGroups.indexOf(cg);
    if (index === -1){
      return false;
    } else {
      delete this.collisionGroups[index];
      return true;
    }
  }

}
