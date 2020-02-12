/*
Interface for the file loader class. This will be different for the client and the server. There isn't very much to this.
This will be for I/O operations.
*/

export interface FileLoader {
  loadConfig():Promise<object>
  loadJSONFile(name:string):Promise<object>
}
