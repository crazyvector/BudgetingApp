/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema before the route handler runs.
 *
 * Usage:
 *   router.post("/", validate(createTransactionSchema), handler);
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formatted = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        error: "Validation Error",
        message: "Invalid request data. Check the 'details' field.",
        details: formatted,
      });
    }

    // Replace req.body with the parsed (and potentially transformed) data
    req.body = result.data;
    next();
  };
}
