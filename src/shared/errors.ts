import { ErrorCode } from "./types";

export class BaseApiError extends Error {
	public readonly code: ErrorCode;
	public readonly statusCode: number;
	public readonly details?: unknown;
	public readonly timestamp: string;

	constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		this.statusCode = statusCode;
		this.details = details;
		this.timestamp = new Date().toISOString();

		// Maintains proper stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
			timestamp: this.timestamp,
			statusCode: this.statusCode
		};
	}
}

export class ValidationError extends BaseApiError {
	constructor(message: string, details?: unknown) {
		super(ErrorCode.VALIDATION, message, 400, details);
	}
}

export class NotFoundError extends BaseApiError {
	constructor(message = "Resource not found", details?: unknown) {
		super(ErrorCode.NOT_FOUND, message, 404, details);
	}
}

export class UnauthorizedError extends BaseApiError {
	constructor(message = "Unauthorized", details?: unknown) {
		super(ErrorCode.UNAUTHORIZED, message, 401, details);
	}
}

export class ForbiddenError extends BaseApiError {
	constructor(message = "Forbidden", details?: unknown) {
		super(ErrorCode.FORBIDDEN, message, 403, details);
	}
}

export class RateLimitError extends BaseApiError {
	public readonly retryAfter: number;

	constructor(message = "Rate limit exceeded", retryAfter = 60, details?: unknown) {
		super(ErrorCode.RATE_LIMITED, message, 429, details);
		this.retryAfter = retryAfter;
	}

	toJSON() {
		return {
			...super.toJSON(),
			retryAfter: this.retryAfter
		};
	}
}

export class InternalServerError extends BaseApiError {
	constructor(message = "Internal server error", details?: unknown) {
		super(ErrorCode.INTERNAL_ERROR, message, 500, details);
	}
}

export class BadRequestError extends BaseApiError {
	constructor(message = "Bad request", details?: unknown) {
		super(ErrorCode.BAD_REQUEST, message, 400, details);
	}
}

export class ConflictError extends BaseApiError {
	constructor(message = "Conflict", details?: unknown) {
		super(ErrorCode.CONFLICT, message, 409, details);
	}
}

export class UnprocessableEntityError extends BaseApiError {
	constructor(message = "Unprocessable entity", details?: unknown) {
		super(ErrorCode.UNPROCESSABLE_ENTITY, message, 422, details);
	}
}
