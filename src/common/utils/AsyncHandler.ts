import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Utilidad POO para envolver controladores asíncronos en Express.
 * Captura excepciones y las delega al ErrorHandlerMiddleware mediante next(error).
 */
export class AsyncHandler {
  public static wrap(fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
