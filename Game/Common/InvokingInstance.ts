/*
This class is the core class for the client and the server, but abstact as the this will either
be run from the server or client class.
*/
import {GameState} from "./GameState";

export abstract class InvokingInstance {
  private gameState:GameState;

  constructor(){
    this.gameState = new GameState(); //Create a gamestate instance.
  }

}
