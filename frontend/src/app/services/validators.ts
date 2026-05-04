import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that a field is not empty or whitespace only
   */
  static required(control: AbstractControl): ValidationErrors | null {
    if (!control.value || (typeof control.value === 'string' && !control.value.trim())) {
      return { required: true };
    }
    return null;
  }

  /**
   * Validates minimum length
   */
  static minLength(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      if (control.value.length < min) {
        return { minlength: { requiredLength: min, actualLength: control.value.length } };
      }
      return null;
    };
  }

  /**
   * Validates maximum length
   */
  static maxLength(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      if (control.value.length > max) {
        return { maxlength: { requiredLength: max, actualLength: control.value.length } };
      }
      return null;
    };
  }

  /**
   * Validates a number is greater than a minimum value
   */
  static minValue(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = Number(control.value);
      if (isNaN(value) || value < min) {
        return { minvalue: { min, actual: value } };
      }
      return null;
    };
  }

  /**
   * Validates a number is less than a maximum value
   */
  static maxValue(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = Number(control.value);
      if (isNaN(value) || value > max) {
        return { maxvalue: { max, actual: value } };
      }
      return null;
    };
  }

  /**
   * Validates date format (YYYY-MM-DD)
   */
  static dateFormat(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(control.value)) {
      return { dateformat: true };
    }
    const date = new Date(control.value);
    if (isNaN(date.getTime())) {
      return { dateformat: true };
    }
    return null;
  }

  /**
   * Validates that a date is not in the past
   */
  static futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return { pastdate: true };
    }
    return null;
  }

  /**
   * Validates that a date is not in the future
   */
  static pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      return { futuredate: true };
    }
    return null;
  }

  /**
   * Validates number format
   */
  static numeric(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = Number(control.value);
    if (isNaN(value)) {
      return { numeric: true };
    }
    return null;
  }

  /**
   * Validates email format
   */
  static email(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(control.value)) {
      return { email: true };
    }
    return null;
  }

  /**
   * Validates URL format
   */
  static url(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    try {
      new URL(control.value);
      return null;
    } catch {
      return { url: true };
    }
  }

  /**
   * Validates that two fields match
   */
  static match(fieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const matchControl = control.parent.get(fieldName);
      if (!matchControl) return null;
      if (control.value !== matchControl.value) {
        return { match: true };
      }
      return null;
    };
  }

  /**
   * Pattern validator
   */
  static pattern(regex: RegExp | string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const regexObj = typeof regex === 'string' ? new RegExp(regex) : regex;
      if (!regexObj.test(control.value)) {
        return { pattern: true };
      }
      return null;
    };
  }

  /**
   * Validates that a name field contains only alphanumeric characters, spaces, hyphens, apostrophes, commas, and periods
   * Rejects special characters like @, #, $, %, &, etc.
   * Allows commas for separating multiple names (e.g., "Lana Wachowski, Lilly Wachowski")
   */
  static noSpecialCharacters(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    // Allow: letters, numbers, spaces, hyphens, apostrophes, commas, periods, and accented characters
    const nameRegex = /^[\p{L}\p{N}\s\-',.àâäéèêëïîôöùûüçœæÀÂÄÉÈÊËÏÎÔÖÙÛÜÇŒÆ]+$/u;
    if (!nameRegex.test(control.value)) {
      return { specialCharacters: true };
    }
    return null;
  }

  /**
   * Validates that a field doesn't have leading or trailing whitespace
   * Allows internal spaces
   */
  static noLeadingTrailingWhitespace(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = typeof control.value === 'string' ? control.value : String(control.value);
    if (value !== value.trim()) {
      return { leadingTrailingWhitespace: true };
    }
    return null;
  }

  /**
   * Validates phone number format (flexible international format)
   * Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
   */
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    // Allow digits, spaces, hyphens, parentheses, and plus sign
    const phoneRegex = /^[\d\s\-().\+]+$/;
    if (!phoneRegex.test(control.value)) {
      return { invalidPhoneFormat: true };
    }
    // Remove non-digit characters and check if at least 7 digits
    const digitCount = control.value.replace(/\D/g, '').length;
    if (digitCount < 7) {
      return { phoneNumberTooShort: true };
    }
    return null;
  }

  /**
   * Validates that username contains only alphanumeric characters, underscores, and hyphens
   * No spaces allowed
   */
  static validUsername(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
    if (!usernameRegex.test(control.value)) {
      return { invalidUsername: true };
    }
    return null;
  }

  /**
   * Validates password strength
   * Requires: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
   */
  static strongPassword(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = control.value;
    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['passwordTooShort'] = true;
    }
    if (!/[A-Z]/.test(value)) {
      errors['noUppercase'] = true;
    }
    if (!/[a-z]/.test(value)) {
      errors['noLowercase'] = true;
    }
    if (!/[0-9]/.test(value)) {
      errors['noNumber'] = true;
    }
    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(value)) {
      errors['noSpecialChar'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Validates that a field contains only alphanumeric characters and spaces
   * Useful for location, city, or state names
   */
  static alphanumericWithSpaces(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const regex = /^[a-zA-Z0-9\s\-àâäéèêëïîôöùûüçœæÀÂÄÉÈÊËÏÎÔÖÙÛÜÇŒÆ]+$/;
    if (!regex.test(control.value)) {
      return { alphanumericOnly: true };
    }
    return null;
  }

  /**
   * Validates that a string doesn't contain only whitespace
   */
  static notOnlyWhitespace(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = typeof control.value === 'string' ? control.value : String(control.value);
    if (value.trim() === '') {
      return { onlyWhitespace: true };
    }
    return null;
  }

  /**
   * Validates minimum character count (after trimming whitespace)
   */
  static minLengthAfterTrim(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const trimmedValue = typeof control.value === 'string' ? control.value.trim() : String(control.value).trim();
      if (trimmedValue.length < min) {
        return { minlength: { requiredLength: min, actualLength: trimmedValue.length } };
      }
      return null;
    };
  }

  /**
   * Validates that integer is positive (greater than 0)
   */
  static positiveInteger(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    const value = Number(control.value);
    if (isNaN(value) || !Number.isInteger(value) || value <= 0) {
      return { positiveInteger: true };
    }
    return null;
  }

  /**
   * Validates that value is a valid non-negative integer
   */
  static nonNegativeInteger(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    const value = Number(control.value);
    if (isNaN(value) || !Number.isInteger(value) || value < 0) {
      return { nonNegativeInteger: true };
    }
    return null;
  }
}
