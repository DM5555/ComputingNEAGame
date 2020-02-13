/*
The main class for the client.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";
import {Renderer} from "./Renderer";
import {Vector2} from "../Common/Vector2"; // TEMP: for testing
import {ClientFileLoader} from "./ClientFileLoader";
import {UserInputHandler} from "./UserInputHandler";
import {NetworkHandler} from "./NetworkHandler";
import {RigidObject} from "../Common/RigidObject";
import {Player} from "../Common/Player";

export class Client extends InvokingInstance{
  private renderer:Renderer;
  private userInputHandler:UserInputHandler;
  private networkHandler:NetworkHandler;
  private player:Player;


  constructor(container:HTMLElement){
    super(Context.CLIENT,()=>{ //Callback for when gamestate is ready.

      console.log("Made new client object!");
      this.renderer = new Renderer(container,this.gameState.world); //Create renderer.
      this.userInputHandler = new UserInputHandler();
      this.networkHandler = new NetworkHandler();
      this.userInputHandler.setup(<ClientFileLoader>this.fileLoader).then(()=>{ //Setup the user input handler.
      return this.renderer.loadAssets(<ClientFileLoader>this.fileLoader);
    }).then(()=>{ //Another callback (chained promises)).
        this.networkHandler.connect("wss://"+window.location.host+":456"); //Connecti to the websocket server.
        this.renderer.setup(); //Begin loading the actual game.

        this.networkHandler.updateConnectionState = (state:String)=>{ //On connection update.
          if (state === "connected"){ //Connection is established.
            this.player = new Player(); //Create the new player object.
            this.networkHandler.selfPlayer = this.player; //Set network handler self player as current player.
            this.networkHandler.transcoder.selfPlayer = this.player; //Set network transcoder self player as current player.
            this.gameState.world.addRigidObject(this.player); //Add the player to the world.

            this.userInputHandler.eventRegistry.addEventListener("Left",(active:boolean)=>{ //Register input for leftwards movement.
              this.player.left = active;
            });
            this.userInputHandler.eventRegistry.addEventListener("Right",(active:boolean)=>{ //Register input for rightwards movement.
              this.player.right = active;
            });

            this.userInputHandler.eventRegistry.addEventListener("Jump",(active:boolean)=>{ //Register input for jumping.
              this.player.jump = active;
            });
          }
        };

        this.networkHandler.eventRegistry.addEventListener("addRigidObject",(ro:RigidObject)=>{ //Recieved and decoded rigid object.
          this.gameState.world.addRigidObject(ro);
        });

        let sendPackets:boolean = false; //Alternating boolean whether to send data over the internet.
        setInterval(()=>{ //TESTING (Also RIP VSync.)
          /*
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
          */

          if (typeof this.player !== "undefined"){ //Update the player only if it exists yet.
            this.player.tick();
            this.renderer.setCameraPosition(Vector2.add(this.player.position,new Vector2(0.5,1))); //Center camera position on the player.

            if (sendPackets){
              this.networkHandler.sendPlayer(this.player); //Send the player's position info over the internet.
            }

            sendPackets = !sendPackets; //Alternate boolean so that packets are only send once every 2 client ticks.

          }
        },1000/120);

      });
    }); //Invoke superclass.
  }
}
