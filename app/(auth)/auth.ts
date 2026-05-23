import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import { AUTH_SECRET_OR_DEV_FALLBACK } from "@/lib/constants";
import { upsertUserFromNaver } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      naverId?: string | null;
      nickname?: string | null;
      profileImage?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    naverId?: string | null;
    nickname?: string | null;
    profileImage?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    naverId?: string | null;
    nickname?: string | null;
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
          name: r.nickname ?? r.name ?? null,
          email: r.email ?? null,
          image: r.profile_image ?? null,
          naverId: r.id,
          nickname: r.nickname ?? r.name ?? null,
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
        profileImage: user.profileImage ?? null,
      });

      user.id = dbUser.id;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.naverId = user.naverId;
        token.nickname = user.nickname;
        token.profileImage = user.profileImage;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.naverId = token.naverId;
        session.user.nickname = token.nickname;
        session.user.profileImage = token.profileImage;
      }
      return session;
    },
  },
});
