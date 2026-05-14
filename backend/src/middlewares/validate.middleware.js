/**
 * Factory function that returns an Express middleware which validates
 * `req.body`, `req.params`, and `req.query` against the provided Zod schema.
 *
 * The schema should expect an object shaped as:
 *   { body?: z.ZodType, params?: z.ZodType, query?: z.ZodType }
 *
 * On success, the parsed (coerced/stripped) values are written back onto the
 * request object and `next()` is called.
 *
 * On failure, HTTP 400 is returned with:
 *   { code: 'VALIDATION_ERROR', message: string, details: ZodIssue[] }
 *
 * @param {import('zod').ZodType} schema
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const { issues } = result.error;
    const message = issues.map((i) => i.message).join('; ');

    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message,
      details: issues,
    });
  }

  const parsed = result.data;

  if (parsed.body !== undefined) req.body = parsed.body;
  if (parsed.params !== undefined) req.params = parsed.params;
  if (parsed.query !== undefined) req.query = parsed.query;

  return next();
};
