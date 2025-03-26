// import { CUSTOM_ERRORS } from "../constants/errors";
import { sleep } from "./sleep";

const InvalidResponse = [
  "invalid response",
  "invalid json response",
  "Ratelimit exceed",
];

export const checkError = (error: any) => {
  const errorText: string =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    error?.response?.data ||
    error?.toString() ||
    "";

  // console.debug('errorText', errorText);
  // if (
  //   Object.values(CUSTOM_ERRORS)
  //     .map(
  //       (err) =>
  //         errorText.toLowerCase().startsWith(err.toLowerCase()) ||
  //         errorText.toLowerCase().includes(err.toLowerCase())
  //     )
  //     .includes(true)
  // ) {
  //   return true;
  // }
  return false;
};

export async function retry<T>(
  request: () => Promise<T>,
  times: number = 10,
  delay: number = 1500,
  customError?: string
): Promise<T> {
  const errors = [];
  let err_: any;

  for (let i = 0; i <= times; i++) {
    try {
      const res = await request();
      if (typeof res === "string" && InvalidResponse.includes(res))
        throw new Error(res);
      return res;
    } catch (error: any) {
      console.error(error);
      err_ = error;
      errors.push(error.message);
      // if (i === times - 1) {
      //   throw error;
      //   // throw new Error(
      //   // 	(error.message ? error.message + ': ' : '') +
      //   // 		(errors[errors.length - 1] ?? 'Something went wrong.')
      //   // );
      // }

      if (checkError(error)) {
        throw new Error(error);
      }
    }
    await sleep(!(i % 2) ? delay * 1.5 : delay);
  }
  throw new Error(errors.join("\n | ~~~ | \n"));
}
