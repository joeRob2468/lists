import { ApiError } from '@repo/common';
import { ZodError } from 'zod';
import fp from 'fastify-plugin';
import { FastifyError } from 'fastify';

export default fp(async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        error: error.error,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'Validation failed',
        statusCode: 400,
        details: error.issues,
      });
    }

    const statusCode = error.statusCode ?? 500;
    app.log.error(error);

    return reply.status(statusCode).send({
      error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : error.name,
      message: error.message || 'An unexpected error occurred',
      statusCode,
    });
  });
});
