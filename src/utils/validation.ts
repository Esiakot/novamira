import { z } from "zod";
import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_REGEX,
  DISPLAY_NAME_MIN_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  BIO_MAX_LENGTH,
} from "@/libs/constants";

// ── Shared field schemas ──

export const usernameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH, `Le nom d'utilisateur doit contenir au moins ${USERNAME_MIN_LENGTH} caractères`)
  .max(USERNAME_MAX_LENGTH, `Le nom d'utilisateur doit contenir au maximum ${USERNAME_MAX_LENGTH} caractères`)
  .regex(USERNAME_REGEX, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores");

export const displayNameSchema = z
  .string()
  .min(DISPLAY_NAME_MIN_LENGTH, "Le nom d'affichage est requis")
  .max(DISPLAY_NAME_MAX_LENGTH, `Le nom d'affichage doit contenir au maximum ${DISPLAY_NAME_MAX_LENGTH} caractères`);

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`);

export const emailSchema = z.string().email("Email invalide");

export const bioSchema = z
  .string()
  .max(BIO_MAX_LENGTH, `La bio ne peut pas dépasser ${BIO_MAX_LENGTH} caractères`)
  .nullable()
  .optional();

export const locationSchema = z
  .string()
  .max(100, "La localisation ne peut pas dépasser 100 caractères")
  .nullable()
  .optional();

export const websiteSchema = z
  .string()
  .url("URL invalide")
  .max(255, "L'URL ne peut pas dépasser 255 caractères")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const sessionIdSchema = z.string().uuid("ID de session invalide");

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{7,15}$/, "Numéro de téléphone invalide");

// ── Composite schemas ──

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  display_name: displayNameSchema,
  phone_number: phoneSchema,
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
