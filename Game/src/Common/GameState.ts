/*
This class is for the main game state which holds information about the players connected,
the objects in the level, the level data, the leader boards, the player handling and other stuff.
Basically, this is the common class (for client and server) for my game.
*/
import {World} from "./World";

export class GameState {
  public readonly world:World;
  private config:object;

  /**Create a new game using the properties defined in the config.json file.*/
  constructor(cfg:object){
    this.config = cfg; //Load config
    this.world = new World(this.config["width"], this.config["height"]); //Risky

  }

}
