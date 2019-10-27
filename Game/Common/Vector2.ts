/*
Class for vectors and operating on them.
*/

export class Vector2 {
  //Represented by v=ai+bj
  a: number;
  b: number;

  /**Create a new vector with a as the x directon and b as the y direction.*/
  constructor(a:number, b:number){ //Simple two points.
    this.a = a;
    this.b = b;
  }
  /**Returns direction in radians. This will be between pi and -pi.*/
  public direction():number{
    return Math.atan2(this.b,this.a);
  }

  /**Get the length/magnitude of the vector.*/
  public magnitude():number{
    return Math.sqrt(this.a**2+this.b**2);
  }


  //STATIC METHODS FOR 2D VECTORS.

  /**Add 2 vectors.*/
  public static add(p:Vector2,q:Vector2):Vector2{
    return new Vector2(p.a+q.a,p.b+q.b);
  }

  /**Subtract the second vector from the first.*/
  public static subtract(p:Vector2,q:Vector2):Vector2{
    return new Vector2(p.a-q.a,p.b-q.b);
  }

  /**Find the dot/scalar product of a vector.*/
  public static dotProduct(p:Vector2,q:Vector2):number{
    return p.a*q.a+p.b*q.b;
  }

  /**Multiply a vector by a number.*/
  public static scale(v:Vector2,m:number):Vector2{
    return new Vector2(v.a*m,v.b*m);
  }
}
