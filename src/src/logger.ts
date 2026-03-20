/**
 * @file Wrapper for base console.
 */

class Logger implements Pick<Console, "log"> {
  /**
   * Get the proper message to be logged to console.
   * @param data whatever a normal console.log() or similar call
   * would capture.
   */
  private getLogMessageArray(data: any[]): any[] {
    return ["From Loop Video extension:", ...data];
  }

  log(...data: any[]): void {
    return console.log(...this.getLogMessageArray(data));
  }
}

export default new Logger();
