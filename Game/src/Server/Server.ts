/*
The main class for the server.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";
import {NetworkTranscoder} from "../Common/NetworkTranscoder";
import {Vector2} from "../Common/Vector2";
import {RigidObject} from "../Common/RigidObject";
import {Entity} from "../Common/Entity";

import WebSocket = require("ws");
import fs = require("fs");
import https = require("https");
import http = require("http");

export class Server extends InvokingInstance{
  WSServer:WebSocket.Server;

  constructor(){
    super(Context.SERVER,()=>{
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

      let testDiamond:RigidObject = this.gameState.world.addRectangle(
        new Vector2(10,10),
        new Vector2(16,16),
        new Vector2(5,5),
        "Diamond"
      );

      setInterval(()=>{ //Test motion.
        testDiamond.position.a += testDiamond.velocity.a/60;
        testDiamond.position.b += testDiamond.velocity.b/60;

        if (testDiamond.position.a < 0){
          testDiamond.velocity.a = Math.abs(testDiamond.velocity.a);
          testDiamond.position.a = 0;
        } else if (testDiamond.position.a > this.gameState.world.sizeX-10){
          testDiamond.velocity.a = -Math.abs(testDiamond.velocity.a);
          testDiamond.position.a = this.gameState.world.sizeX-10;
        }

        if (testDiamond.position.b < 0){
          testDiamond.velocity.b = Math.abs(testDiamond.velocity.b);
          testDiamond.position.b = 0;
        } else if (testDiamond.position.b > this.gameState.world.sizeY-10){
          testDiamond.velocity.b = -Math.abs(testDiamond.velocity.b);
          testDiamond.position.b = this.gameState.world.sizeY-10;
        }

      },1000/60);
    }); //Invoke superclass. Callback is for test purposes.
    console.log("Made new server object! Now creating WS server.");
    this.createServer(456);
  }

  /**Create a server with the specified port number. 0-65535 */
  private createServer(port:number):void{


    let cert:Buffer = fs.readFileSync("../Login Server/.secret/cert.crt");
    let key:Buffer = fs.readFileSync("../Login Server/.secret/key.key");

    let HTTPSServer:https.Server = https.createServer({
      cert:cert,
      key:key
    });
    this.WSServer = new WebSocket.Server({
      server: HTTPSServer
    });

    HTTPSServer.listen(456);


    this.WSServer.on("connection",(conn:WebSocket)=>{
      console.log("Connection established!");


      let sendEntity:(ent:Entity)=>void = (ent:Entity)=>{
        if (ent instanceof RigidObject){ //The entity is a rigidObject.
          let encoded:Buffer = testTranscoder.encodeRigidObject(ent);
          conn.send(encoded);
        }
      }

      let testTranscoder:NetworkTranscoder = new NetworkTranscoder();

      for (let e of this.gameState.world.getEntities()){
        sendEntity(e);
      }

      this.gameState.world.eventRegistry.addEventListener("addEntity",(ent:Entity)=>{ //Entity add event on server.
        sendEntity(ent);
      });

      conn.on("message",(data:string)=>{ //Message recieved.
      });

      setInterval(()=>{
        for (let e of this.gameState.world.getEntities()){
          if (e instanceof RigidObject && (e.velocity.a !== 0 || e.velocity.b !== 0)){ //Non still objects.
            sendEntity(e);
          }
        }
      },1000/60);

    });
  }
}
