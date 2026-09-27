/** Plain JavaScript identifier, e.g. "r" or "data". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const REGEXP_OPTION_KEYS = ["escape", "evaluate", "interpolate"] as const;

/**
 * Rejects template input that must not reach `_.template`.
 * A `variable` option is allowed only when it is a plain identifier.
 * An `imports` option and values of the wrong type are rejected.
 */
export function validateTemplateInput(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Invalid template passed into `_.template`");
  }
  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid options passed into `_.template`");
  }

  const opts = options as Record<string, unknown>;

  if (opts.imports !== undefined) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }

  if (opts.variable !== undefined) {
    if (typeof opts.variable !== "string" || !PLAIN_IDENTIFIER.test(opts.variable)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
  }

  for (const key of REGEXP_OPTION_KEYS) {
    const value = opts[key];
    if (value != null && !(value instanceof RegExp)) {
      throw new TypeError(`Invalid \`${key}\` option passed into \`_.template\``);
    }
  }

  if (opts.sourceURL != null && typeof opts.sourceURL !== "string") {
    throw new TypeError("Invalid `sourceURL` option passed into `_.template`");
  }
}
