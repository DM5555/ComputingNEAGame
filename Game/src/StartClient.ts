/*
Initiates the game client.
NOTE: THIS WILL MOSTLY BE TESTING FOR NOW.
*/

import {Client} from "./Client/Client";
export function StartClient(containerId:string):Client{ //Load the client object using the specified container id.
  let container:HTMLElement = document.getElementById(containerId); //Get html object from container id.
  const client:Client = new Client(container); //Create new client.
  console.log("Created Client!");
  return client;
}
