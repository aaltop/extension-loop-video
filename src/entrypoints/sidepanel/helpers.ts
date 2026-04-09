import { Response } from "@/src/typing/commands";
import { Logger } from "./ConsoleContext";

/**
 * Handle the response, performing general actions based on the result of
 * the response.
 */
export function handleResponse(response: Response<unknown>, logger: Logger) {
  if (!response.success) {
    logger.error("Error from request:", response.message);
  }
}
