// lib/validations/auth.schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères"), // Bonne pratique sécu
  username_handle: z.string().min(2, "Le handle est trop court"),
  username_display: z.string().min(1, "Le nom d'affichage est requis"),
  firstname: z.string().optional(), // .optional() permet d'envoyer undefined ou chaîne vide
  lastname: z.string().optional(),
  bio: z.string().optional(),
});
