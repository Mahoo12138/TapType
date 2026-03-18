export enum ErrorCode {
  // Common Validation
  V000 = 'server.validation.error',

  // Validation
  V001 = 'user.validation.is_empty',
  V002 = 'user.validation.is_invalid',

  // Error
  E001 = 'user.error.username_or_email_exists',
  E002 = 'user.error.not_found',
  E003 = 'user.error.email_exists',
  E004 = 'user.error.invalid_image_format',
  E005 = 'user.error.file_too_large',
  E006 = 'user.error.invalid_password',
}
