import {FileLoader} from "../Common/FileLoader";
import {Vector2} from "../Common/Vector2";
import {World} from "../Common/World";

/**This class is used to load the world information and objects from a JSON file. */
export class WorldLoader {
  private fileName:string;
  private fileLoader:FileLoader;
  private worldData:object;
  private waitingForLoadWorld:World;

  constructor(fileName:string, fileLoader:FileLoader){
      this.fileName = fileName;
      this.fileLoader = fileLoader;

      this.fileLoader.loadJSONFile("world").then((json:object)=>{
        this.worldData = json;
        if (typeof this.waitingForLoadWorld !== "undefined"){
          this.addObjects(this.waitingForLoadWorld);
        }
      });
  }

  public addObjects(world:World):void{
    if (typeof this.worldData !== "undefined"){
      let rectangles:Array<object> = this.worldData["rectangles"];
      rectangles.forEach((rect:object)=>{ //Iterate rectangle objects.
        let size:[number,number] = rect["dim"]; //Rectangle dimensions.
        let position:[number,number] = rect["pos"]; //Rectangle position.
        let velocity:[number,number] = rect["vel"]; //Rectangle velocity.
        let textureName:string = rect["tex"]; //Rectangle texture name.

        //Turn the number tuples into vectors.
        let v_size:Vector2 = new Vector2(size[0],size[1]);
        let v_position:Vector2 = new Vector2(position[0],position[1]);
        let v_velocity:Vector2 = new Vector2(velocity[0],velocity[1]);

        world.addRectangle(v_size,v_position,v_velocity,textureName); //Add the new object.
      });
    } else {
      this.waitingForLoadWorld = world;
    }
  };
}
