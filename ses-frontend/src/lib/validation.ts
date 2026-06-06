import { z } from 'zod';

// Backend constraints from jakarta.validation annotations.
const NAME_MAX = 100;
const EMAIL_MAX = 150;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const VENUE_NAME_MAX = 150;
const LOCATION_MAX = 255;
const CONTACT_PATTERN = /^$|^\+?[0-9\-\s]{7,20}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Email must be valid')
  .max(EMAIL_MAX, `Email must be at most ${EMAIL_MAX} characters`);

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`);

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`);

export const contactNoSchema = z
  .string()
  .trim()
  .regex(CONTACT_PATTERN, 'Contact number must be 7-20 digits and may start with +')
  .optional()
  .or(z.literal(''));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    contactNo: contactNoSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const adminCreateUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm the password'),
    contactNo: contactNoSchema,
    role: z.enum(['ORGANIZER', 'ADMIN']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserSchema>;

export const venueSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(VENUE_NAME_MAX, `Name must be at most ${VENUE_NAME_MAX} characters`),
  location: z
    .string()
    .trim()
    .min(1, 'Location is required')
    .max(LOCATION_MAX, `Location must be at most ${LOCATION_MAX} characters`),
  capacity: z
    .number({ invalid_type_error: 'Capacity is required' })
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1'),
});

export type VenueFormValues = z.infer<typeof venueSchema>;

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
      .optional()
      .or(z.literal('')),
    dateTime: z
      .string()
      .min(1, 'Date and time are required')
      .refine(
        (v) => !isNaN(new Date(v).getTime()) && new Date(v).getTime() > Date.now(),
        'Event date/time must be in the future',
      ),
    venueMode: z.enum(['existing', 'custom']),
    venueId: z.number().int().positive().optional().nullable(),
    customVenueName: z
      .string()
      .trim()
      .max(VENUE_NAME_MAX)
      .optional()
      .or(z.literal('')),
    customLocation: z
      .string()
      .trim()
      .max(LOCATION_MAX)
      .optional()
      .or(z.literal('')),
    capacity: z
      .number()
      .int('Capacity must be a whole number')
      .min(1, 'Capacity must be at least 1')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.venueMode === 'existing') {
      if (!data.venueId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['venueId'],
          message: 'Please pick a venue',
        });
      }
    } else {
      if (!data.customVenueName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customVenueName'],
          message: 'Venue name is required',
        });
      }
      if (!data.customLocation?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customLocation'],
          message: 'Location is required',
        });
      }
      if (data.capacity == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['capacity'],
          message: 'Capacity is required when no venue is selected',
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventSchema>;
