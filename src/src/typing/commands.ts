/**
 * A request sent to a content script.
 * @param Com The type of the command sent with the request.
 * @param  Data The type of the data sent with the request.
 */
export interface Request<Com, Data = object> {
  command: Com;
  data: Data;
}

/**
 * A response sent from a content script.
 * @param Data The type of the data sent with the response.
 */
export type Response<Data> =
  | { success: false; message: string }
  | {
      success: true;
      data: Data;
    };
