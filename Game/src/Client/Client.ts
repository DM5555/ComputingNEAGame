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
          new Vector2(0,0), //30 along, 16 down.
          new Vector2(0,0), //Stationary.
          "Bricks"
        );
        this.gameState.world.addRectangle(
          new Vector2(2,2),
          new Vector2(25,20),
          new Vector2(0,0)
        );

        setInterval(()=>{ //TESTING (Also RIP VSync.)
          let newCameraPosition:Vector2 = this.renderer.getCameraPosition();

          if (this.userInputHandler.isActionActive("Up") && !this.userInputHandler.isActionActive("Down")){
            if(newCameraPosition.b > 0){
              newCameraPosition.b-=0.1;
            }
          }
          if (this.userInputHandler.isActionActive("Down") && !this.userInputHandler.isActionActive("Up")){
            if(newCameraPosition.b < this.gameState.world.sizeY-0.1){
              newCameraPosition.b+=0.1;
            }
          }
          if (this.userInputHandler.isActionActive("Left") && !this.userInputHandler.isActionActive("Right")){
            if(newCameraPosition.a > 0){
              newCameraPosition.a-=0.1;
            }
          }
          if (this.userInputHandler.isActionActive("Right") && !this.userInputHandler.isActionActive("Left")){
            if(newCameraPosition.a < this.gameState.world.sizeX/2){
              newCameraPosition.a+=0.1;
            }
          }

          this.renderer.setCameraPosition(newCameraPosition);
        },1000/120);
        
      });
    }); //Invoke superclass.
  }
}
