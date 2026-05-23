import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import { AUTH_SECRET_OR_DEV_FALLBACK } from "@/lib/constants";
import { upsertUserFromNaver } from "@/lib/db/queries";
import type { UserRole } from "@/lib/db/schema";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      naverId?: string | null;
      nickname?: string | null;
      realName?: string | null;
      profileImage?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: UserRole;
    naverId?: string | null;
    nickname?: string | null;
    realName?: string | null;
    profileImage?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    naverId?: string | null;
    nickname?: string | null;
    realName?: string | null;
    profileImage?: string | null;
  }
}

type NaverApiProfile = {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  secret: AUTH_SECRET_OR_DEV_FALLBACK,
  session: { strategy: "jwt" },
  providers: [
    {
      id: "naver",
      name: "Naver",
      type: "oauth",
      authorization: {
        url: "https://nid.naver.com/oauth2.0/authorize",
        params: { response_type: "code" },
      },
      token: "https://nid.naver.com/oauth2.0/token",
      userinfo: "https://openapi.naver.com/v1/nid/me",
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      profile(profile: NaverApiProfile) {
        const r = profile.response;
        return {
          id: r.id,
          name: r.name ?? r.nickname ?? null,
          email: r.email ?? null,
          image: r.profile_image ?? null,
          naverId: r.id,
          nickname: r.nickname ?? null,
          realName: r.name ?? null,
          profileImage: r.profile_image ?? null,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "naver" || !user.naverId) {
        return false;
      }

      const dbUser = await upsertUserFromNaver({
        naverId: user.naverId,
        email: user.email ?? null,
        nickname: user.nickname ?? null,
        name: user.realName ?? null,
        profileImage: user.profileImage ?? null,
      });

      // Carry the DB row's user-editable fields into the user object
      // so the jwt() callback below picks them up — otherwise a
      // re-login would propagate Naver's nickname into the JWT and
      // overwrite the user's customized one in the session.
      user.id = dbUser.id;
      user.role = dbUser.role;
      user.nickname = dbUser.nickname ?? null;
      user.realName = dbUser.name ?? null;
      user.profileImage = dbUser.profileImage ?? null;
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "customer";
        token.naverId = user.naverId;
        token.nickname = user.nickname;
        token.realName = user.realName;
        token.profileImage = user.profileImage;
      }
      if (
        trigger === "update" &&
        session &&
        typeof session === "object" &&
        "nickname" in session &&
        typeof (session as { nickname: unknown }).nickname === "string"
      ) {
        token.nickname = (session as { nickname: string }).nickname;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.naverId = token.naverId;
        session.user.nickname = token.nickname;
        session.user.realName = token.realName;
        session.user.profileImage = token.profileImage;
      }
      return session;
    },
  },
});
