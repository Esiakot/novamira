import { NextResponse } from "next/server";
import { getSessionUser } from "@/libs/session";

type AuthUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

type AuthenticatedContext = { user: AuthUser };
type UnauthenticatedContext = { user: null };

type AuthenticatedHandler<T = Request> = (
  request: T,
  context: AuthenticatedContext,
) => Promise<NextResponse>;

type UnauthenticatedHandler<T = Request> = (
  request: T,
  context: UnauthenticatedContext,
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with:
 * - Authentication check (if `auth: true`, default)
 * - Automatic try/catch with 500 error response
 */
export function apiHandler<T = Request>(
  handler: AuthenticatedHandler<T>,
  options?: { auth?: true },
): (request: T) => Promise<NextResponse>;
export function apiHandler<T = Request>(
  handler: UnauthenticatedHandler<T>,
  options: { auth: false },
): (request: T) => Promise<NextResponse>;
export function apiHandler<T = Request>(
  handler: AuthenticatedHandler<T> | UnauthenticatedHandler<T>,
  options: { auth?: boolean } = { auth: true },
) {
  return async (request: T): Promise<NextResponse> => {
    try {
      if (options.auth !== false) {
        const user = await getSessionUser();
        if (!user) {
          return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        return await (handler as AuthenticatedHandler<T>)(request, { user });
      }

      return await (handler as UnauthenticatedHandler<T>)(request, { user: null });
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 },
      );
    }
  };
}
