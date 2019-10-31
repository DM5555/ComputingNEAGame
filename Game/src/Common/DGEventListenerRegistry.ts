/*
Class for storing event listeners.
*/

import {DGEventListener} from "./DGEventListener";

export class DGEventListenerRegistry {
  private eventListeners:DGEventListener[];

  constructor(){
    this.eventListeners = [];
  }

  /**Add an event listener.*/
  public addEventListener(eventName:string,eventCallback:(res:any)=>void):DGEventListener{
    let evtListener:DGEventListener = new DGEventListener(eventName,eventCallback);
    this.eventListeners.push(evtListener);
    return evtListener;
  }

  /**Remove an event listener.*/
  public removeEventListener(evtListener:DGEventListener):void{
    for (let i in this.eventListeners){
      if (this.eventListeners[i] == evtListener){
        delete this.eventListeners[i];
      }
    }
  }

  /**Dispatch all events under the name. (Res is the data to pass to the callback functions)*/
  public dispatchEvent(eventName:string,res:any):void{
    for (let l of this.eventListeners){
      if (l.eventName == eventName){
        l.callback(res);
      }
    }
  }
}
