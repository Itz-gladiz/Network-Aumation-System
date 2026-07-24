import { useAuth } from "../context/AuthContext";

/**
 * Hides children unless the current user's role is in `roles`.
 * Usage: <RequireRole roles={["ADMIN", "ENGINEER"]}><button>Deploy Now</button></RequireRole>
 */
export default function RequireRole({ roles, children, fallback = null }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return fallback;
  return children;
}
