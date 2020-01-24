import {RigidObject} from "../Common//RigidObject";
import {Context} from "../Common/Context";
import {Vector2} from "../Common/Vector2";
import {Buffer} from "../Common/Buffer";

/**Converts objects and information into data that can be send across the internet.*/
export class NetworkTranscoder{
  private nextID:number; //ID to use for the next object.
  private Buffer:{new():Buffer};

  /**Create a network transcoder. The buffer class must be passed to this.*/
  constructor(Buffer:{new():Buffer}){
    this.Buffer = Buffer;
  }

  /**Encode the (new) RigidObject into data.*/
  public encodeRigidObject(ro:RigidObject):Buffer{
    //Fields defined here.
    let id:number = this.nextID;
    this.nextID++;
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
}
