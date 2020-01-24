/**Does stuff relating to the communications such as handle connections and encode/decode data on the client side. */
export class NetworkHandler {
  private ws:WebSocket;

  constructor(){
  }

  /**Connect to the specified server. */
  public connect(url:string):void{

    this.disconnect(); //Close any existing connections.
    console.log("Attempting connection to " + url);
    this.ws = new WebSocket(url);
    this.ws.onopen = ()=>{
      console.log("WS Connection Established.");
      setTimeout(()=>{
        this.ws.send(JSON.stringify({msg:"Test"}));
      },5000);

      this.ws.onmessage = (ev:MessageEvent):any=>{
        console.log("Data recieved:" + ev.data);
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
