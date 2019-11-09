/*
The main class for the client.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";
import {Renderer} from "./Renderer";
import {Vector2} from "../Common/Vector2"; // TEMP: for testing

export class Client extends InvokingInstance{
  renderer:Renderer;

  constructor(container:HTMLElement){
    super(Context.CLIENT,()=>{ //Callback for when gamestate is ready.
      console.log("Made new client object!");
      this.renderer = new Renderer(container,this.gameState.world); //Create renderer.

      // TEMP: for testing
      this.gameState.world.addRectangle(
        new Vector2(75,75), //50 by 75.
        new Vector2(100,100), //100 along, 100 down.
        new Vector2(0,0) //Still.
      );
    }); //Invoke superclass.
  }
}
