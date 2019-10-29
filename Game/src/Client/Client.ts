/*
The main class for the client.
*/

import {InvokingInstance} from "../Common/InvokingInstance";
import {Context} from "../Common/Context";

export class Client extends InvokingInstance{
  constructor(){
    super(Context.CLIENT); //Invoke superclass.
    console.log("Made new client object!");
  }
}
