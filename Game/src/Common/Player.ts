import {RigidObject} from "./RigidObject";
import {Vector2} from "./Vector2";
import {BoundingBox} from "./BoundingBox";

const playerHitbox:BoundingBox = new BoundingBox([
  (new Vector2(1,2)),
  (new Vector2(1,-2)),
  (new Vector2(-1,-2)),
  (new Vector2(-1,2)),
]);

const movementAcceleration:number = 8; //3ms^-2 acceleration when moving horizontally.
const groundFriction:number = 0.3; //Speed multiplier is 0.1 per second (90% lost per second).
const airResistance:number = 0.75; //Air resistance is 0.75 per second (25% lost per second).
const jumpVelocity:number = 20; //Player jump velocity when they jump.

/**Player class for the actual game play.*/
export class Player extends RigidObject {
  public left:boolean; //Boolean for leftwards movement.
  public right:boolean; //Boolean for rightwards movement.
  public jump:boolean; //Boolean for jumping.

  constructor(){ //Create a new player object.
    super(playerHitbox,playerHitbox,new Vector2(30,20), new Vector2(0,0),"Player");
    //Set movement controls to off.
    this.left = false;
    this.right = false;
    this.jump = false
  }

  public tick():void{ //Tick the player.
    //Collision testing
    if (this.position.a < 0){ //Left boundary check.
      this.position.a = 0; //Set x position to 0.
      this.velocity.a = Math.abs(this.velocity.a*0.5); //Make velocity positive.
    } else if (this.position.a > 62){ //Right boundary check.
      this.position.a = 62; //Reset position.
      this.velocity.a = -Math.abs(this.velocity.a*0.5); //Make velocity negative on the x axis.
    }
    if (this.position.b < 0){ //Top boundary check.
      this.position.b = 0; //Set y position to 0.
      this.velocity.b = Math.abs(this.velocity.b*0.5); //Make velocity positive.
    } else if (this.position.b > 32){ //Right boundary check.
      this.position.b = 32; //Reset position.
      this.velocity.b = -Math.abs(this.velocity.b*0.5); //Make velocity negative on the y axis.
    }

    if (this.position.b < 32 - 9.81/120){ //Apply gravitational acceleration or ground friction otherwise.
      this.velocity.b += 9.81/120;
      this.velocity.a *= airResistance**(1/120); //Apply air resistance.
    } else {
      this.velocity.a *= groundFriction**(1/120); //Apply ground friction.

      if (this.jump){ //Apply jump velocity.
        this.velocity.b = -jumpVelocity;
      }
    }

    if (this.left && !this.right){ //Leftwards movement.
      if (this.position.a > movementAcceleration/120){ //Only if not to close to left border.
        this.velocity.a -= movementAcceleration/120; //Apply acceleration.
      }
    }

    if (this.right && !this.left){ //Rightwards movement.
      if (this.position.a < 62-movementAcceleration/120){ //Only if not to close to right border.
        this.velocity.a += movementAcceleration/120; //Apply acceleration.
      }
    }

    //Update positions.
    this.position.a += this.velocity.a/120;
    this.position.b += this.velocity.b/120;
  }
}
