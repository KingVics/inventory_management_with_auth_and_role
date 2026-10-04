import { CustomError } from '../utils/customError.js';



export function errorHandler(
  err,
  req,
  res,
  next,
) {

  const fromHttpError =
    typeof (err).status === 'number'
      ? (err).status
      : typeof (err).statusCode === 'number'
        ? (err).statusCode
        : null;

  const statusCode =
    err instanceof CustomError ? err.statusCode : (fromHttpError ?? 500);

  const message = err.message || 'Something went wrong';

  if (statusCode >= 500) {
    console.error(err);
  }

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}
