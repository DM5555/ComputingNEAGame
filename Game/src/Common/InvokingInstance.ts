/*
This class is the core class for the client and the server, but abstact as the this will either
be run from the server or client class.
*/
import {GameState} from "./GameState";
import {Context} from "./Context";
import {FileLoader} from "./FileLoader";

export abstract class InvokingInstance {
  protected gameState:GameState;
  protected fileLoader:FileLoader;
  protected config:object;

  //This is an async function so it needs a callback.
  constructor(ctx:Context,callback:()=>void){
    if (ctx === Context.CLIENT){ //Define the file loader based on whether it is client or server.
      this.fileLoader = new (require("../Client/ClientFileLoader").ClientFileLoader)();
    } else if (ctx === Context.SERVER){
      this.fileLoader = new (require("../Server/ServerFileLoader").ServerFileLoader)();
    } else { //Log an error if an invalid context is supplied.
      console.error("An invalid context was supplied to the invoking instance. This shouldn't be posible!");
    }

    this.fileLoader.loadConfig().then((cfg:object)=>{
      this.config = cfg;
      this.gameState = new GameState(this.config); //Create a gamestate instance.
      callback();
      console.log("GameState created!");
    }).catch((err:any)=>{
      if (err instanceof Error){
        console.error("ACTUAL ERROR OCCURRED");
        console.error("Error" +  err.stack);
        throw err;
      } else {
        console.error("Game state could not be created as the configuration file failed to load! Error Code: " + err);
      }
    });
  }


}
