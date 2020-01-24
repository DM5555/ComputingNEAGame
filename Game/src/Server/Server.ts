/*
The main class for the server.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";
import WebSocket = require("ws");
import fs = require("fs");
import https = require("https");
import http = require("http");

export class Server extends InvokingInstance{
  WSServer:WebSocket.Server;

  constructor(){
    super(Context.SERVER,()=>{}); //Invoke superclass. No callback needed for now.
    console.log("Made new server object! Now creating WS server.");
    this.createServer(456);
  }

  /**Create a server with the specified port number. 0-65535 */
  private createServer(port:number):void{
    this.WSServer = new WebSocket.Server({
      server: (http.createServer({
        /*cert: fs.readFileSync("../Login Server/.secret/cert.crt"),
        key: fs.readFileSync("../Login Server/.secret/key.key")*/
      })),
      port: port
    });

    this.WSServer.on("connection",(conn:WebSocket)=>{
      console.log("Connection established!");
      conn.send("Test2");

      conn.on("message",(data:string)=>{ //Message recieved.
        console.log("Message recieved: " + data);
      });
    });
  }
}
