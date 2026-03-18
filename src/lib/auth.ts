import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const devProvider =
  process.env.NODE_ENV === "development"
    ? [
        Credentials({
          id: "dev",
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" },
          },
          async authorize(credentials) {
            if (!credentials?.email) return null;
            const user = await prisma.user.findUnique({
              where: { email: credentials.email as string },
            });
            return user;
          },
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.FROM_EMAIL ?? "noreply@doughflow.app",
    }),
    ...devProvider,
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});
