import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      validatePasswordRequirements(password) {
        if (password.length < 12 || password.length > 128) {
          throw new Error("Password must be between 12 and 128 characters.");
        }
      },
    }),
  ],
});
