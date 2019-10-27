/*
The main class for the client.
*/

import {InvokingInstance} from "../Common/InvokingInstance";

export class Client extends InvokingInstance{
  constructor(){
    super(); //Invoke superclass.
    console.log("Made new client object!");
  }
}
