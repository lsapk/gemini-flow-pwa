import { authenticate, endpoint, HttpError } from "./http.ts";

// Keep deployed legacy URLs closed until their replacement has an audited contract.
export function retiredHandler(message: string) {
  return endpoint(async (req) => {
    await authenticate(req);
    throw new HttpError(410, message);
  });
}
