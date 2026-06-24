import type { UserRole } from "@prisma/client";

/** Shape of the user object attached to every authenticated request. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  matriculeNumber: string | null;
  role: UserRole;
  roleWeight: number;
  ministryId: string | null;
  departmentId: string | null;
  divisionId: string | null;
  sessionId: string;
  permissions: string[];
  mfaEnabled: boolean;
}

/** Access token JWT payload (RS256). */
export interface AccessTokenPayload {
  sub: string; // userId
  jti: string; // unique token id (for blacklisting)
  role: UserRole; // highest active role
  weight: number; // role weight
  ministryId: string | null;
  departmentId: string | null;
  divisionId: string | null;
  sessionId: string;
  iat: number;
  exp: number;
}

/** Refresh token JWT payload (RS256). */
export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string;
  sessionId: string;
  family: string; // token family for reuse detection
  iat: number;
  exp: number;
}

/** Short-lived MFA challenge token payload. */
export interface MfaChallengePayload {
  sub: string; // userId
  type: "mfa_challenge";
  iat: number;
  exp: number;
}
