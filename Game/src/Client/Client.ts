/*
The main class for the client.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";
import {Renderer} from "./Renderer";
import {Vector2} from "../Common/Vector2"; // TEMP: for testing
import {ClientFileLoader} from "./ClientFileLoader";
import {UserInputHandler} from "./UserInputHandler";

export class Client extends InvokingInstance{
  private renderer:Renderer;
  private userInputHandler:UserInputHandler;


  constructor(container:HTMLElement){
    super(Context.CLIENT,()=>{ //Callback for when gamestate is ready.

      console.log("Made new client object!");
      this.renderer = new Renderer(container,this.gameState.world); //Create renderer.
      this.userInputHandler = new UserInputHandler();

      this.userInputHandler.setup(<ClientFileLoader>this.fileLoader).then(()=>{ //Setup the user input handler.

      return this.renderer.loadAssets(<ClientFileLoader>this.fileLoader);
    }).then(()=>{ //Another callback (chained promises)).
        this.renderer.setup(); //Begin loading the actual game.

        // TEMP: for testing
        this.gameState.world.addRectangle(
          new Vector2(4,4), //4m by 4m.
          new Vector2(30,16), //34 along, 20 down.
          new Vector2(0,0) //Stationary.
        );
      });
    }); //Invoke superclass.
  }
}
