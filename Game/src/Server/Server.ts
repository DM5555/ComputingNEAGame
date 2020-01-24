/*
The main class for the server.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";
import {NetworkTranscoder} from "../Common/NetworkTranscoder";
import {Vector2} from "../Common/Vector2";
import {RigidObject} from "../Common/RigidObject";

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

      let testRectangle:RigidObject = this.gameState.world.addRectangle(new Vector2(10,10), new Vector2(0,0), new Vector2(0,0),"Bricks"); //Test rectangle.
      let testTranscoder:NetworkTranscoder = new NetworkTranscoder(Context.SERVER);

      conn.send(testTranscoder.encodeRigidObject(testRectangle));
      conn.on("message",(data:string)=>{ //Message recieved.
        console.log("Message recieved: " + data);
      });

    });
  }
}
