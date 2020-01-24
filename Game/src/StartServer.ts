/*
Starts the game server.
*/


import {Server} from "./Server/Server";

function StartServer():void{
  const server: Server = new Server();
  console.log("Created server");
}

StartServer();
