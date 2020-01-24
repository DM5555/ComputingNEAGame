/**Interface for the buffer class.*/
export interface Buffer {
  writeFloatBE(value:number,offset:number):number
  writeUInt32BE(value:number,offset:number):number
  writeUInt16BE(value:number,offset:number):number
  writeUInt8(value:number,offset:number):number
  write(data:string,offset:number,encoding:string):number
  static alloc(size:number):Buffer
}
