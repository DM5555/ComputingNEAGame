/*
These collision groups store groups of entities which define how they interact with entities in the same group and in other groups.
*/
import {Entity} from "./Entity";

export class CollisionGroup{
  private entities:Entity[];
  constructor(){

  }

  public addEntity(e:Entity):void{ //Add an entity to the entities list.
    this.entities.push(e);
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
