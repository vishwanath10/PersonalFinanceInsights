export class PdfPasswordRequiredError extends Error {
  constructor(message = "This PDF is password-protected. Enter password to continue.") {
    super(message);
    this.name = "PdfPasswordRequiredError";
  }
}

export class PdfIncorrectPasswordError extends Error {
  constructor(message = "Incorrect PDF password. Please try again.") {
    super(message);
    this.name = "PdfIncorrectPasswordError";
  }
}
