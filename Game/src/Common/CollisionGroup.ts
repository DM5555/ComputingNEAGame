/*
These collision groups store groups of entities which define how they interact with entities in the same group and in other groups.
*/
import {Entity} from "./Entity";

export class CollisionGroup{
  private entities:Entity[]; //Entities bound to this group.
  private collidingGroups:CollisionGroup[]; //Collision groups that this collides with.

  constructor(){

  }

  public addEntity(e:Entity):void{ //Add an entity to the entities list.
    this.entities.push(e);
  }
  
  // NOTE: For objects in the same group to collide, the collision group must have itself listed in the colliding groups.
  public addCollidingGroup(cg:CollisionGroup):void{ //Adds a collision group for this group to collide to.
    if (this.collidingGroups.indexOf(cg) === -1){ //Make sure it isnt already in the list.
      this.collidingGroups.push(cg);
    }
  }

  public removeCollidingGroup(cg:CollisionGroup):boolean{ //Remove a colliding group. This is probably redundant.
    let index:number = this.collidingGroups.indexOf(cg);
    if (index === -1){ //Existence check.
      return false;
    } else {
      delete this.collidingGroups[index];
      return true;
    }
  }

  public removeEntity(e:Entity):boolean{ //Remove an entity.
    let index:number = this.entities.indexOf(e);

    if (index === -1){
      return false;
    } else {
      delete this.entities[index];
      return true;
    }
  }

  public getEntities():Entity[]{ //Get a list of entities safely.
    return (<any>Entity).assign([],this.entities); //Safely copy list.
  }

}
