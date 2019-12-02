/*This is the class which handles user input events such as key presses and mouse clicks. */

import {ClientFileLoader} from "./ClientFileLoader";
import {KeyboardKey} from "./KeyboardKey";
import {KeyboardAction} from "./KeyboardAction";
import {DGEventListenerRegistry} from "../Common/DGEventListenerRegistry";

/**Class for handling user input (key presses and mouse clicks). Abbreviated using UIH.*/
export class UserInputHandler {
  private keys:Map<string,KeyboardKey>;
  private actions:Map<string,KeyboardAction>
  private keyActionBindings:[[KeyboardAction,KeyboardKey]];
  public readonly eventRegistry:DGEventListenerRegistry;

  /**Create a new user input handler. To use this, setup() must be called.*/
  constructor(){
    this.eventRegistry = new DGEventListenerRegistry(); //Create an event registry.
  }

  /**Load the keymapping for the UIH*/
  public setup(fileLoader:ClientFileLoader):Promise<object>{
    return new Promise((resolve:()=>void,reject:(e:any)=>void)=>{
      fileLoader.loadJSONFile("keymap").then((keyJSON:object)=>{ //Keymap loads successfully.
        this.actions = new Map(); //Initialise actions list.
        this.keys = new Map(); //Initialise keys list.
        this.keyActionBindings = <[[KeyboardAction,KeyboardKey]]>new Array(); //Initialise keyActionBindings
        for (let action of Object.keys(keyJSON)){ //Index keyJSON and register each key.
          let actionObject = new KeyboardAction(action); //Create action object.
          this.actions.set(action,actionObject); //Add action to map.
          for (let key of keyJSON[action]){ //Index every key of each action.
            if (!this.keys.has(key)){ //Only create a new key object if it is not already present.
              let keyObject:KeyboardKey = new KeyboardKey(key); //Create a new key object.
              this.keys.set(key,keyObject);  //Add this to the mapping.
            }
            let keyObject = this.keys.get(key); //Get the key object to register in the binding.
            this.keyActionBindings.push([actionObject,keyObject]); //Add this to the bindings.
          }
        }
        this.registerWindowEvents();
        resolve(); //End promise here.
      }).catch((e)=>{ //Keymap fails to load.
        console.log("The keymap could not be loaded!");
        reject(e);
      })
    });
  }

  /**Get the actions bound to a key. */
  private getActionsFromKey(key:KeyboardKey):[KeyboardAction]{
    let actionList:[KeyboardAction] = <[KeyboardAction]>new Array(); //Create a list of actions.
    for (let entry of this.keyActionBindings){ //Iterate every entry.
      if (entry[1] === key){ //Check if the entry key and the key specified in the argument are the same.
        actionList.push(entry[0]); //Add to the return list.
      }
    }

    return actionList;
  }

  /**Get the keys from an action name.*/
  private getKeysFromAction(action:KeyboardAction):[KeyboardKey]{
    let keyList:[KeyboardKey] = <[KeyboardKey]>new Array(); //Create a list of keys.
    for (let entry of this.keyActionBindings){ //Iterate each entry.
      if (entry[0] === action){ //Check if the action names are the same.
        keyList.push(entry[1]); //If so, add to the key list.
      }
    }

    return keyList;
  }

  /**Create the event handler for the window. Should alaways called from setup()*/
  private registerWindowEvents():void{
    //Functions below must be passed like this because JavaScript is weird with scoping.
    window.addEventListener("keydown",(evt)=>{this.windowKeyDown(evt)}) //Keydown event.
    window.addEventListener("keyup",(evt)=>{this.windowKeyUp(evt)}); //Keyup event.
  }

  /**Called on window keydown.*/
  private windowKeyDown(keyboardEvent:KeyboardEvent):void{
    if (this.keys.has(keyboardEvent.code)){ //Check if the key is registered and only do something if it is.
      let key:KeyboardKey = this.keys.get(keyboardEvent.code); //Get key.
      if (!key.isPressed()){ //Only if the key is not already pressed.
        key.keyPress(); //Activate the key.
        let associatedActions = this.getActionsFromKey(key); //Get all actions which this key is bound to.
        for (let action of associatedActions){ //Index each acton.
          if (!action.isActive()){ //Only if the action is not active.
            action.actionStart(); //Set action to active.
            this.eventRegistry.dispatchEvent(action.actionName, true); //Activate the event!.
          }
        }
      }
    }
  }

  /**Called when a key is released.*/
  private windowKeyUp(keyboardEvent:KeyboardEvent):void{
    if (this.keys.has(keyboardEvent.code)){ //Check if the key is actually registered.
      let key:KeyboardKey = this.keys.get(keyboardEvent.code); //Get key object.
      if (key.isPressed()){ //Only if the key is recorded as pressed.
        key.keyRelease(); //Disable key.
        let associatedActions = this.getActionsFromKey(key); //Get associated actions.
        for (let action of associatedActions){ //Index these actions.
          if (action.isActive()){ //Only if this action is active.
            let actionKeys = this.getKeysFromAction(action); //Get keys bound to this action.
            let anyKeysPressed:boolean = false; //Whether any actions are active.
            for (let k of actionKeys){ //Index action keys list.
              if (k.isPressed()){ //There is a key pressed so dont stop the event.
                anyKeysPressed = true;
                break; //Stop this foor loop.
              }
            }

            if (!anyKeysPressed){ //No keys for this action were pressed so stop the action now.
              action.actionStop(); //Stop action.
              this.eventRegistry.dispatchEvent(action.actionName,false); //Send out event to stop action!
            }
          }
        }
      }
    }
  }

  /**Check if an action is active. THIS IS CASE SENSITIVE!!!*/
  public isActionActive(actionName:string):boolean{
    if (this.actions.has(actionName)){ //Check if the action exists.
      return this.actions.get(actionName).isActive(); //Return state.
    } else {
      throw new Error("The action specified does not exist in the registry!");
    }
  }
}
