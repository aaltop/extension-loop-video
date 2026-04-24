import * as z from "zod";

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
 * Create the schema for a {@link Request} sent to a content script.
 * @param commandSchema The schema for the type of the command sent with the
 * request.
 * @param dataSchema The schema for the type of data sent with the request.
 */
export function requestSchema<Com extends z.ZodType, Data extends z.ZodType>(
  commandSchema: Com,
  dataSchema: Data,
) {
  return z.object({
    command: commandSchema,
    data: dataSchema,
  });
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

/**
 * Create the schema for a {@link Response} sent from a content script.
 * @param dataSchema The schema for the type of data sent with the response.
 */
export function responseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion("success", [
    z.object({ success: z.literal(false), message: z.string() }),
    z.object({ success: z.literal(true), data: dataSchema }),
  ]);
}

export function parseAndReturnResponse<TSchema extends z.ZodType>(
  schema: ReturnType<typeof responseSchema<TSchema>>,
  response: Response<unknown>,
) {
  const parsed = schema.safeParse(response);
  parsed.success;
  if (parsed.success) {
    return parsed.data;
  } else {
    const failResponse: Response<unknown> = {
      success: false,
      message: parsed.error.message,
    };
    return failResponse;
  }
}
