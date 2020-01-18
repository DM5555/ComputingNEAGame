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
          new Vector2(1,1), //4m by 4m.
          new Vector2(0,0), //30 along, 16 down.
          new Vector2(0,0), //Stationary.
          "Bricks"
        );

        this.gameState.world.addRectangle(
          new Vector2(1,1), //4m by 4m.
          new Vector2(63,35), //30 along, 16 down.
          new Vector2(0,0), //Stationary.
          "Bricks"
        );
        this.gameState.world.addRectangle(
          new Vector2(66,1),
          new Vector2(-1,-1),
          new Vector2(0,0),
          "Stripes"
        );
        this.gameState.world.addRectangle(
          new Vector2(66,1),
          new Vector2(-1,36),
          new Vector2(0,0),
          "Stripes"
        );
        this.gameState.world.addRectangle(
          new Vector2(1,36),
          new Vector2(-1,0),
          new Vector2(0,0),
          "Stripes"
        );
        this.gameState.world.addRectangle(
          new Vector2(1,36),
          new Vector2(64,0),
          new Vector2(0,0),
          "Stripes"
        );


        setInterval(()=>{ //TESTING (Also RIP VSync.)
          let newCameraPosition:Vector2 = this.renderer.getCameraPosition();

          if (this.userInputHandler.isActionActive("Up") && !this.userInputHandler.isActionActive("Down")){
            if(newCameraPosition.b >= 0){
              newCameraPosition.b-=0.1;
            }

            if(newCameraPosition.b < 0){
              newCameraPosition.b=0;
            }
          }
          if (this.userInputHandler.isActionActive("Down") && !this.userInputHandler.isActionActive("Up")){
            if(newCameraPosition.b <= this.gameState.world.sizeY){
              newCameraPosition.b+=0.1;
            }

            if(newCameraPosition.b > this.gameState.world.sizeY){
              newCameraPosition.b=this.gameState.world.sizeY;
            }
          }
          if (this.userInputHandler.isActionActive("Left") && !this.userInputHandler.isActionActive("Right")){
            if(newCameraPosition.a >= 0){
              newCameraPosition.a-=0.1;
            }

            if(newCameraPosition.a < 0){
              newCameraPosition.a=0;
            }
          }
          if (this.userInputHandler.isActionActive("Right") && !this.userInputHandler.isActionActive("Left")){
            if(newCameraPosition.a <= this.gameState.world.sizeX){
              newCameraPosition.a+=0.1;
            }

            if(newCameraPosition.a > this.gameState.world.sizeX){
              newCameraPosition.a=this.gameState.world.sizeX;
            }
          }

          this.renderer.setCameraPosition(newCameraPosition);
        },1000/120);

      });
    }); //Invoke superclass.
  }
}
