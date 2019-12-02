/**Simple class for each keyboard key. Not much to it.*/
export class KeyboardKey {
  private pressed:boolean;
  public readonly keyCode:string;

  /**Simple constructor for the keycode.*/
  constructor(keyCode:string){
    this.keyCode = keyCode;
    this.pressed = false;
  }

  /**Call this when the key is pressed.*/
  public keyPress():void{
    this.pressed = true;
  }

  /**Call this when the key is released. */
  public keyRelease():void{
    this.pressed = false;
  }

  /**Returns whether the key is pressed or not. */
  public isPressed():boolean{
    return this.pressed;
  }
}
