import { StatusCodes } from 'http-status-codes';

export const HttpCodes = () => {
  const Ok = StatusCodes.OK;
  const CREATED = StatusCodes.CREATED;
  const BAD_REQUEST = StatusCodes.BAD_REQUEST;
  const INTERNAL_SERVER_ERROR = StatusCodes.INTERNAL_SERVER_ERROR;
  const UNAUTHORIZED = StatusCodes.UNAUTHORIZED;
  const NOT_FOUND = StatusCodes.NOT_FOUND;
  const FORBIDDEN = StatusCodes.FORBIDDEN;
  const NO_CONTENT = StatusCodes.NO_CONTENT;
  const CONFLICT = StatusCodes.CONFLICT;
  const TOO_MANY_REQUESTS = StatusCodes.TOO_MANY_REQUESTS;

  return {
    TOO_MANY_REQUESTS,
    CONFLICT,
    NO_CONTENT,
    Ok,
    CREATED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    UNAUTHORIZED,
    NOT_FOUND,
    FORBIDDEN,
  };
};
