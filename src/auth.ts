import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { loginSchema } from '@/lib/auth/validationSchemas';
import { authenticateUser } from '@/lib/services/authService';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        return authenticateUser(parsed.data);
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.sessionVersion = user.sessionVersion ?? -1;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      session.user.sessionVersion =
        typeof token.sessionVersion === 'number' ? token.sessionVersion : -1;

      return session;
    },
  },
});
