export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "offline";

export type Surface = "auth" | "api" | "database";

export type ErrorCode = `${ErrorType}:${Surface}`;

const visibilityBySurface: Record<Surface, "response" | "log"> = {
  auth: "response",
  api: "response",
  database: "log",
};

export class AppError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();
    const [type, surface] = errorCode.split(":") as [ErrorType, Surface];
    this.type = type;
    this.surface = surface;
    this.cause = cause;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    if (visibility === "log") {
      console.error({ code, message: this.message, cause: this.cause });
      return Response.json(
        { code: "", message: "Something went wrong. Please try again later." },
        { status: this.statusCode }
      );
    }

    return Response.json(
      { code, message: this.message, cause: this.cause },
      { status: this.statusCode }
    );
  }
}

function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.endsWith(":database")) {
    return "An error occurred while executing a database query.";
  }
  switch (errorCode) {
    case "unauthorized:auth":
      return "You need to sign in before continuing.";
    case "forbidden:auth":
      return "Your account does not have access to this feature.";
    case "bad_request:api":
      return "The request couldn't be processed. Please check your input and try again.";
    default:
      return "Something went wrong. Please try again later.";
  }
}

function getStatusCodeByType(type: ErrorType): number {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
