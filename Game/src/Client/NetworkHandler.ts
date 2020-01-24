import {NetworkTranscoder} from "../Common/NetworkTranscoder";

/**Does stuff relating to the communications such as handle connections and encode/decode data on the client side. */
export class NetworkHandler {
  private ws:WebSocket;
  private transcoder:NetworkTranscoder;
  constructor(){
    this.transcoder = new NetworkTranscoder();
  }

  /**Connect to the specified server. */
  public connect(url:string):void{

    this.disconnect(); //Close any existing connections.
    console.log("Attempting connection to " + url);
    this.ws = new WebSocket(url);
    this.ws.onopen = ()=>{
      console.log("WS Connection Established.");

      this.ws.onmessage = (ev:MessageEvent):any=>{
        let data:any = ev.data;
        console.log("Data recieved:",ev.data);
        if (data instanceof Blob){
          let fr:FileReader = new FileReader(); //Create reader for data.
          fr.readAsArrayBuffer(data);
          fr.addEventListener("loadend",()=>{ //Asynchronously read.
            console.log("RigidObject:",this.transcoder.decodeRigidObject(fr.result));
          });
        }
      }
    }

    this.ws.onerror = function(e:any):void{
      console.log("Error:",e);
    }

  }

  /**Disconnect from the server. */
  public disconnect():void{
    if (typeof this.ws !== "undefined"){ //Only close if the connection exists in the first place.
      this.ws.close();
    }
    this.ws = undefined;

  }
}
