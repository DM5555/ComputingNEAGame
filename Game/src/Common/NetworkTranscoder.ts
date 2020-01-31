import {RigidObject} from "../Common//RigidObject";
import {Vector2} from "../Common/Vector2";
import {BoundingBox} from "../Common/BoundingBox";
import {Entity} from "../Common/Entity";

/**Converts objects and information into data that can be send across the internet.*/
export class NetworkTranscoder{
  private nextID:number; //ID to use for the next object.
  private IDEntityMappings:Map<number,Entity>;


  /**Create a network transcoder. The buffer class must be passed to this.*/
  constructor(){
    this.IDEntityMappings = new Map();
    this.nextID = 0;
  }

  /**Encode the (new) RigidObject into data.*/
  public encodeRigidObject(ro:RigidObject):Buffer{
    //Fields defined here.
    let id:number;
    let entityFound:boolean = false;
    this.IDEntityMappings.forEach((value:RigidObject,key:number)=>{
      if (value === ro){ //Entity is already registered.
        id = key; //The ID is equal to the key.
        entityFound = true;
      }
    });

    if (!entityFound){ //Entity not registered
      id = this.nextID; //Create a new ID.
      this.nextID++;
      this.IDEntityMappings.set(id,ro);
    }

    let textureLength:number = ro.getTextureName().length;
    let textureName:string = ro.getTextureName();
    let positionX:number = ro.position.a;
    let positionY:number = ro.position.b;
    let velocityX:number = ro.velocity.a;
    let velocityY:number = ro.velocity.b;
    let hitboxNodeCount:number = ro.hitbox.nodes.length;
    let hitboxNodes:Vector2[] = ro.hitbox.nodes;
    let drawmodelNodeCount:number = ro.drawmodel.nodes.length;
    let drawmodelNodes:Vector2[] = ro.drawmodel.nodes;

    //Total length in BYTES.
    let totalLength:number = 4 + 1 + textureLength + 4 + 4 + 4 + 4 + 2 + hitboxNodeCount*4*2 + 2 + drawmodelNodeCount*4*2;

    //Create a new buffer.
    let buf:Buffer = Buffer.alloc(totalLength);
    let offset:number = 0; //Offset to write at.

    buf.writeUInt32BE(id,offset); //ID.
    offset+=4;

    buf.writeUInt8(textureLength,offset); //Texture length.
    offset+=1;

    buf.write(textureName,offset,"ascii"); //Texture name.
    offset+=textureLength;

    buf.writeFloatBE(positionX,offset); //Position X.
    offset+=4;
    buf.writeFloatBE(positionY,offset); //Position Y.
    offset+=4;

    buf.writeFloatBE(velocityX,offset); //Velocity X.
    offset+=4;
    buf.writeFloatBE(velocityY,offset); //Velocity Y.
    offset+=4;

    buf.writeUInt16BE(hitboxNodeCount,offset); //Hitbox node count.
    offset+=2;

    for (let node of hitboxNodes){ //Index all the nodes.
        buf.writeFloatBE(node.a,offset); //Write X pos.
        offset+=4;
        buf.writeFloatBE(node.b,offset); //Write Y pos.
        offset+=4;
    }

    buf.writeUInt16BE(drawmodelNodeCount,offset); //Drawmodel node count.
    offset+=2;

    for (let node of drawmodelNodes){ //Index all the nodes.
        buf.writeFloatBE(node.a,offset); //Write X pos.
        offset+=4;
        buf.writeFloatBE(node.b,offset); //Write Y pos.
        offset+=4;
    }

    return buf;
  }

  /**Turn the binary version of a rigid object into a JS object.*/
  public decodeRigidObject(data:any):RigidObject{
    let buf:Buffer = Buffer.from(data);

    let offset:number = 0;

    let id:number = buf.readInt32BE(offset); //Read ID.
    offset+=4;

    let textureLength:number = buf.readUInt8(offset);  //Read texture length.
    offset+=1;

    let textureName:string = buf.slice(offset,offset+textureLength).toString("ascii"); //Read texture name.
    offset+=textureLength;

    let positionX:number = buf.readFloatBE(offset); //X position.
    offset+=4;
    let positionY:number = buf.readFloatBE(offset); //Y position.
    offset+=4;

    let velocityX:number = buf.readFloatBE(offset); //X velocity.
    offset+=4;
    let velocityY:number = buf.readFloatBE(offset); //Y velocity.
    offset+=4;

    let hitboxNodeCount:number = buf.readUInt16BE(offset); //Hitbox node count.
    offset+=2;

    let hitboxNodes:Vector2[] = new Array<Vector2>(); //Create new 2D Vector array.
    for (let i:number=0; i<hitboxNodeCount; i++){
      let x:number = buf.readFloatBE(offset); //X position of node.
      offset+=4;
      let y:number = buf.readFloatBE(offset); //Y position of node.
      offset+=4;

      hitboxNodes.push(new Vector2(x,y));
    }

    let drawmodelNodeCount:number = buf.readUInt16BE(offset); //Drawmodel node count.
    offset+=2;

    let drawmodelNodes:Vector2[] = new Array<Vector2>(); //Create new 2D Vector array.
    for (let i:number=0; i<drawmodelNodeCount; i++){
      let x:number = buf.readFloatBE(offset); //X position of node.
      offset+=4;
      let y:number = buf.readFloatBE(offset); //Y position of node.
      offset+=4;

      drawmodelNodes.push(new Vector2(x,y));
    }

    let hitbox:BoundingBox = new BoundingBox(hitboxNodes);
    let drawmodel:BoundingBox = new BoundingBox(drawmodelNodes);
    let position:Vector2 = new Vector2(positionX,positionY);
    let velocity:Vector2 = new Vector2(velocityX,velocityY);

    if(this.IDEntityMappings.has(id)){ //Entity already registered
      let exisitingEntity:RigidObject = <RigidObject>this.IDEntityMappings.get(id);

      //Update the positions of the entity to the values recieved over the network.
      exisitingEntity.position.a = positionX;
      exisitingEntity.position.b = positionY;

      //Update the velocities of the entity to the value recieved.
      exisitingEntity.velocity.a = velocityX;
      exisitingEntity.velocity.b = velocityY;

      return exisitingEntity; //Return this entity.
    } else { //Entity was not registered and needs to be created so that it can be passed to the renderer class.
      let ro:RigidObject = new RigidObject(hitbox,drawmodel,position,velocity,textureName); //Create new RigidObject.
      this.IDEntityMappings.set(id,ro); //Return the new object that was just created.
      return ro;
    }
  }
}
