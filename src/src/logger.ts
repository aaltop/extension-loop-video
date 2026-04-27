/**
 * @file Wrapper for base console.
 */

class Logger implements Pick<Console, "log"> {
  /**
   * Get the proper message to be logged to console.
   * @param data whatever a normal console.log() or similar call
   * would capture.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getLogMessageArray(data: any[]): any[] {
    return ["From Loop Video extension:", ...data];
  }

  // the same interface as the native console.log, so that's how it is
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(...data: any[]): void {
    return console.log(...this.getLogMessageArray(data));
  }
}

export default new Logger();
