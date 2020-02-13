import {NetworkTranscoder} from "../Common/NetworkTranscoder";
import {DGEventListenerRegistry} from "../Common/DGEventListenerRegistry";
import {Player} from "../Common/Player";
import {RigidObject} from "../Common/RigidObject";
/**Does stuff relating to the communications such as handle connections and encode/decode data on the client side. */
export class NetworkHandler {
  private ws:WebSocket;
  public transcoder:NetworkTranscoder;
  public eventRegistry:DGEventListenerRegistry; //Event registry.
  public connectionState:string;
  public updateConnectionState:(state:String)=>void; //On connection state update.
  public selfPlayer:Player; //Player that should not be updated over the network.

  constructor(){
    this.transcoder = new NetworkTranscoder();
    this.eventRegistry = new DGEventListenerRegistry();
    this.updateState("disconnected");
  }

  /**Connect to the specified server. */
  public connect(url:string):void{
    this.disconnect(); //Close any existing connections.
    console.log("Attempting connection to " + url);
    this.ws = new WebSocket(url);
    this.ws.onopen = ()=>{
      console.log("WS Connection Established.");
      this.updateState("connected");

      this.ws.onmessage = (ev:MessageEvent):any=>{
        let data:any = ev.data;
        if (data instanceof Blob){
          let fr:FileReader = new FileReader(); //Create reader for data.
          fr.readAsArrayBuffer(data);
          fr.addEventListener("loadend",()=>{ //Asynchronously read.
            let ro:RigidObject = this.transcoder.decodeRigidObject(fr.result); //Decode rigidObject
            if (ro !== this.selfPlayer){ //Only if this is not the current player.
              this.eventRegistry.dispatchEvent("addRigidObject",ro); //Dispatch event.
            }
          });
        }
      }
    }

    this.ws.onerror = (e:any)=>{
      console.log("Error:",e);
      this.updateState("errored");
    }

  }

  /**Disconnect from the server. */
  public disconnect():void{
    if (typeof this.ws !== "undefined"){ //Only close if the connection exists in the first place.
      this.ws.close();
    }
    this.ws = undefined;
    this.updateState("disconnected");
  }

  /**Update state.*/
  private updateState(state:string):void{
    this.connectionState = state;
    if (typeof this.updateConnectionState !== "undefined"){ //Null procedure check.
      this.updateConnectionState(state);
    }
  }

  /**Send the data on a player over the internet.*/
  public sendPlayer(pl:Player):void{
    let data:Buffer = this.transcoder.encodeRigidObject(pl); //Encode the rigid object.
    this.ws.send(data); //Send the data.
  }
}
