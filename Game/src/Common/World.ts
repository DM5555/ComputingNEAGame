/*
This is the class where infomration about the environment will be stored. This will include things such as entities, level data,
collision groups, etc...
*/
import {CollisionGroup} from "./CollisionGroup";
import {Entity} from "./Entity";
import {RigidObject} from "./RigidObject";
import {Vector2} from "./Vector2";
import {BoundingBox} from "./BoundingBox";
import {DGEventListenerRegistry} from "./DGEventListenerRegistry"

export class World{
  private collisionGroups: CollisionGroup[]; //This is a dynamic list of collision groups.
  private entities:Entity[]; //All of the entities in the world.
  public readonly sizeX:number; //World width.
  public readonly sizeY:number; //World height.
  public readonly eventRegistry:DGEventListenerRegistry; //Event registry.

  constructor(sizeX:number, sizeY:number){ //Create a new world with the given dimension.
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.eventRegistry = new DGEventListenerRegistry(); //Create event listener registry.
    this.entities = []; //Create new entity list.

    console.log("New world created!");
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
      delete this.collisionGroups[index]; //Removes collision group from existence.
      return true;
    }
  }


  /**Gets all of the entities in the world.*/
  public getEntities():Entity[]{
    let clonedEntities:Entity[] = [];
    Object.assign(clonedEntities,this.entities);
    return clonedEntities;
  }

  /**Add a rectangle to the world.*/
  public addRectangle(size:Vector2,pos:Vector2,velocity:Vector2,textureName?:string):RigidObject{
    let boxNodes:Vector2[] = [ //Create box.
      new Vector2(-size.a/2,-size.b/2), //Top left.
      new Vector2(size.a/2,-size.b/2), //Top right.
      new Vector2(size.a/2,size.b/2), //Bottom right.
      new Vector2(-size.a/2,size.b/2) //Bottom left.
    ];
    let bBox:BoundingBox = new BoundingBox(boxNodes);

    let rigidObject:RigidObject = new RigidObject(bBox,bBox,pos,velocity,textureName); //Create object.
    this.entities.push(rigidObject); //Add object to world.
    this.eventRegistry.dispatchEvent("addEntity",rigidObject); //Dispatch an add entity event.
    return rigidObject; //Return object.
  }

  /**Removes the given entity from the world.*/
  public removeEntity(e:Entity):void{
    this.eventRegistry.dispatchEvent("deleteEntity",e); //Calls delete event.
    delete this.entities[this.entities.indexOf(e)]; //Deletes object (also from existence).
  }
}
