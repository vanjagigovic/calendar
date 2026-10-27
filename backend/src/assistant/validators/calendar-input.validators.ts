import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { DateTime } from 'luxon';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLocalDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    LOCAL_DATE_PATTERN.test(value) &&
    DateTime.fromISO(value, { zone: 'utc' }).isValid
  );
}

export function isValidIanaTimeZone(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    DateTime.local().setZone(value).isValid
  );
}

export function IsLocalDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLocalDate',
      target: object.constructor,
      propertyName,
      options: {
        message: ({ property }: ValidationArguments) =>
          `${property} must be a valid calendar date in YYYY-MM-DD format`,
        ...validationOptions,
      },
      validator: { validate: isValidLocalDate },
    });
  };
}

export function IsIanaTimeZone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIanaTimeZone',
      target: object.constructor,
      propertyName,
      options: {
        message: ({ property }: ValidationArguments) =>
          `${property} must be a valid IANA time zone`,
        ...validationOptions,
      },
      validator: { validate: isValidIanaTimeZone },
    });
  };
}
