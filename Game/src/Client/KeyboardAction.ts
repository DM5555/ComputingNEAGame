/**Simple class for each keyboard action. Not much to it.*/
export class KeyboardAction {
  private active:boolean;
  public readonly actionName:string;

  /**Simple constructor for the actionName.*/
  constructor(actionName:string){
    this.actionName = actionName;
    this.active = false;
  }

  /**Call this when the action beings.*/
  public actionStart():void{
    this.active = true;
  }

  /**Call this when the action finishes.*/
  public actionStop():void{
    this.active = false;
  }

  /**Returns whether the action is active or not.*/
  public isActive():boolean{
    return this.active;
  }
}
