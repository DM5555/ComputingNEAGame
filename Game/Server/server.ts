/*
The main class for the server.
*/

import {InvokingInstance} from "../Common/InvokingInstance";

export class Server extends InvokingInstance{
  constructor(){
    super(); //Invoke superclass.
    console.log("Made new server object!");
  }
}
