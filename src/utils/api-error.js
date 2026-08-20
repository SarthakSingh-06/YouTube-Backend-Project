class API_Error extends Error {
    constructor(statusCode, message, errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = null;
        this.success = false;

        if (stack) {
            this.stack = stack;
        } else {
            this.stack = Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { API_Error };
