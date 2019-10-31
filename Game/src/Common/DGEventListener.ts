/*
Class for an event listener. Just has the name and callback.
*/

export class DGEventListener {
  public eventName:string;
  public callback:(res:any)=>void;

  constructor(eventName:string,callback:(res:any)=>void){
    this.eventName = eventName;
    this.callback = callback;
  }
}
