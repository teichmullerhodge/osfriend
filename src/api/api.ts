import { Parser } from "./parser.ts";

const FLAG_DEBUG = false;

export enum StatusCode {
  // 1xx – Informational
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLY_HINTS = 103,

  // 2xx – Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTI_STATUS = 207,
  ALREADY_REPORTED = 208,
  IM_USED = 226,

  // 3xx – Redirection
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  USE_PROXY = 305,
  SWITCH_PROXY = 306,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,

  // 4xx – Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  MISDIRECTED_REQUEST = 421,
  UNPROCESSABLE_ENTITY = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // 5xx – Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  VARIANT_ALSO_NEGOTIATES = 506,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  NOT_EXTENDED = 510,
  NETWORK_AUTHENTICATION_REQUIRED = 511
}


export enum HttpMethod {

  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PUT",
  DELETE = "DELETE",

}


export enum RequestErrors {

  PARSER_ERROR = "INVALID_TYPED_RESPONSE",
  NETWORK_ERROR = "NETWORK_ERROR",
  
}

export interface RequestResponse<T> {  
  error: RequestErrors | string | null | Record<string, unknown>, 
  data: T | null,
  text: string | null,
  statusCode: number
}

export type PromiseResponse<T> = Promise<RequestResponse<T>> 

export class BackendChannel {

   static ok(status: number){
      return status >= 200 && status < 300;
   }
   static okOrKill<T>(req: RequestResponse<T>){
    if(!BackendChannel.ok(req.statusCode) || req.data === null) { 
      throw new Error(`Status not in the range [200,299] or data is null error. 
                      \nStatusCode: ${req.statusCode} | data: ${JSON.stringify(req.data, null, 2)} | text: ${req.text}`
                     );
    }
      return req.data;
   }
  
   static async perform<T>(method: HttpMethod, route: string, body: any = null, headers: Record<string, string> = {}, keysArray: (keyof T)[] = []): Promise<RequestResponse<T>> {
        const options: RequestInit = {
            method: method,
            headers: headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }
        try {

            const response = await fetch(route, options);
            const rawText = await response.text();
            if (response.ok) {
                const json = Parser.safeJson(rawText) 
                if(FLAG_DEBUG) console.log(`Request at route: ${route} | ${JSON.stringify(json, null, 2)}`);

                if (keysArray.length > 0 && json !== null && !Parser.parseMiddleware<T>(json, keysArray)) {
                    if(FLAG_DEBUG) console.error(`Request in route: ${route} has invalid response: ${JSON.stringify(json, null, 2)}`);
                    return {
                        
                        data: json as T, // force cast, but alert in the error field that is an invalid typed response
                        text: rawText,
                        error: RequestErrors.PARSER_ERROR,
                        statusCode: response.status
                    };
                }

                return {
                    data: json as T || null,
                    text: rawText,
                    error: null,
                    statusCode: response.status
                };
            }
            
            if(FLAG_DEBUG) console.error(`Request at route: ${route} | ${JSON.stringify(response.statusText, null, 2)}`);

            const jsonErr = Parser.safeJson(rawText);
            return {
                data: null,
                text: rawText,
                error: jsonErr,
                statusCode: response.status
            };
        } catch (error) {
            return {
                data: null,
                error: `${error}`,
                text: null,
                statusCode: 0
            };
        }
    }

    static resolve<T>(res: RequestResponse<T>){
      return res.data !== null ? res.data : null;
    }
  
  static async get<T>(route: string, headers: Record<string, string>, keys: (keyof T)[] = []): Promise<RequestResponse<T>> {
    return this.perform<T>(HttpMethod.GET, route, null, headers, keys);  }   
  
  static async post<T>(route: string, headers: Record<string, string>, body: any | null, keys: (keyof T)[] = []): Promise<RequestResponse<T>> {
    return this.perform<T>(HttpMethod.POST, route, body, headers, keys);
  }   
  static async patch<T>(route: string, headers: Record<string, string>, body: any | null, keys: (keyof T)[] = []): Promise<RequestResponse<T>> {
    return this.perform<T>(HttpMethod.PATCH, route, body, headers, keys);
  }   
  static async put<T>(route: string, headers: Record<string, string>, body: any | null, keys: (keyof T)[] = []): Promise<RequestResponse<T>> {
    return this.perform<T>(HttpMethod.PUT, route, body, headers, keys);
  }   
  static async delete<T>(route: string, headers: Record<string, string>, body: any | null, keys: (keyof T)[] = []): Promise<RequestResponse<T>> {
    return this.perform<T>(HttpMethod.DELETE, route, body, headers, keys);
  }   
}
