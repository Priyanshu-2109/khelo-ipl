import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo-client";
import { ensureDbSetup } from "@/lib/mongo-indexes";

async function loadUserByEmail(email: string) {
  const db = await getDb();
  await ensureDbSetup(db);
  return db.collection("users").findOne({ email: email.toLowerCase(), isActive: true });
}

async function loadUserById(id: string) {
  const db = await getDb();
  try {
    return db.collection("users").findOne({ _id: new ObjectId(id), isActive: true });
  } catch {
    return null;
  }
}

const googleProvider =
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.SESSION_MAX_AGE_SEC ?? 60 * 60 * 24 * 7),
    updateAge: Number(process.env.SESSION_UPDATE_AGE_SEC ?? 60 * 60 * 24),
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        const user = await loadUserByEmail(email);
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash as string);
        if (!ok) return null;

        const db = await getDb();
        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

        return {
          id: (user._id as ObjectId).toString(),
          email: user.email as string,
          name: user.displayName as string,
          image: (user.profilePicture as string) || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = (
        profile?.email ??
        user.email ??
        ""
      ).toLowerCase();
      if (!email) return false;

      const db = await getDb();
      await ensureDbSetup(db);
      const displayName =
        (profile?.name as string) ||
        user.name ||
        email.split("@")[0] ||
        "Player";
      const profilePicture =
        (profile as { picture?: string })?.picture ?? user.image ?? null;

      const existing = await db.collection("users").findOne({ email });
      if (!existing) {
        await db.collection("users").insertOne({
          email,
          displayName,
          passwordHash: null,
          profilePicture,
          isAdmin: false,
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          lastLogin: new Date(),
          provider: "google",
        });
      } else {
        await db.collection("users").updateOne(
          { email },
          {
            $set: {
              lastLogin: new Date(),
              displayName: existing.displayName || displayName,
              profilePicture: profilePicture ?? existing.profilePicture,
            },
          }
        );
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user?.email && account?.provider === "google") {
        const dbUser = await loadUserByEmail(user.email);
        if (dbUser) {
          token.sub = (dbUser._id as ObjectId).toString();
          token.isAdmin = !!(dbUser as { isAdmin?: boolean }).isAdmin;
          token.displayName = dbUser.displayName as string;
          token.profilePicture = (dbUser as { profilePicture?: string }).profilePicture ?? null;
        }
      }
      if (user && account?.provider === "credentials") {
        token.sub = user.id;
        const dbUser = await loadUserById(user.id!);
        if (dbUser) {
          token.isAdmin = !!(dbUser as { isAdmin?: boolean }).isAdmin;
          token.displayName = dbUser.displayName as string;
          token.profilePicture = (dbUser as { profilePicture?: string }).profilePicture ?? null;
        }
      }
      if (trigger === "update" && session) {
        if (session.displayName != null) token.displayName = session.displayName as string;
        if (session.profilePicture !== undefined)
          token.profilePicture = session.profilePicture as string | null;
        if (token.sub) {
          const fresh = await loadUserById(token.sub);
          if (fresh) {
            token.isAdmin = !!(fresh as { isAdmin?: boolean }).isAdmin;
            token.displayName = fresh.displayName as string;
            token.profilePicture = (fresh as { profilePicture?: string }).profilePicture ?? null;
          }
        }
      }
      if (token.sub && !token.displayName) {
        const dbUser = await loadUserById(token.sub);
        if (dbUser) {
          token.isAdmin = !!(dbUser as { isAdmin?: boolean }).isAdmin;
          token.displayName = dbUser.displayName as string;
          token.profilePicture = (dbUser as { profilePicture?: string }).profilePicture ?? null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as { isAdmin?: boolean }).isAdmin = !!token.isAdmin;
        session.user.name = (token.displayName as string) || session.user.name;
        session.user.image = (token.profilePicture as string) || session.user.image;
        (session.user as { displayName?: string }).displayName =
          (token.displayName as string) || session.user.name || "";
        (session.user as { profilePicture?: string | null }).profilePicture =
          (token.profilePicture as string | null) ?? null;
      }
      return session;
    },
  },
});
