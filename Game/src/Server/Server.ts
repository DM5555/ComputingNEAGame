/*
The main class for the server.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";

export class Server extends InvokingInstance{

  constructor(){
    super(Context.SERVER,()=>{}); //Invoke superclass. No callback needed for now.
    console.log("Made new server object!");
  }
}
