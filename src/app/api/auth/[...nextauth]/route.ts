import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      authProvider?: string
    }
    accessToken?: string
  }
  
  interface User {
    id: string
    email: string
    name?: string
    authProvider?: string
    access_token?: string
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' },
        userId: { label: 'User ID', type: 'text' },
        authMethod: { label: 'Auth Method', type: 'text' }
      },
      async authorize(credentials) {
        // Handle WebAuthn authentication
        if (credentials?.authMethod === 'webauthn' && credentials?.token && credentials?.userId) {
          try {
            // Verify JWT token
            const jwt = credentials.token;
            // Parse JWT payload (simple decode - the token was already verified by our WebAuthn endpoint)
            const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
            
            return {
              id: payload.userId,
              email: payload.email,
              name: payload.email,
              authProvider: 'webauthn'
            }
          } catch (error) {
            console.error('WebAuthn token verification failed:', error);
            return null;
          }
        }
        
        // Handle email/password authentication
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Call our API to verify credentials
          const baseUrl = process.env.NEXTAUTH_URL
          if (!baseUrl) {
            throw new Error('NEXTAUTH_URL environment variable is required')
          }
          const response = await fetch(`${baseUrl}/api/auth/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            
            // Check if 2FA is required
            if (result.requires_2fa) {
              // Store the 2FA state in a way that can be accessed by the signin page
              // We return a special user object that indicates 2FA is needed
              return {
                id: result.user_id,
                email: result.email,
                name: result.email, // Temporary name until 2FA is complete
                authProvider: 'email',
                requires_2fa: true,
                // Don't include access_token since 2FA is not complete
              }
            }
            
            // Normal login (no 2FA required)
            return {
              id: result.id,
              email: result.email,
              name: `${result.first_name} ${result.last_name}`.trim(),
              authProvider: 'email',
              access_token: result.access_token // Capture JWT token from API response
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }
        
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // For OAuth providers (Google), use account access token
        // For credentials provider, use our JWT token
        token.accessToken = (user as any).access_token || account.access_token
        token.userId = user.id
        token.authProvider = (user as { authProvider?: string }).authProvider || 'google'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        // Store user in database on first login (Google OAuth only)
        if (token.authProvider === 'google' && session.user.email) {
          await storeUserIfNotExists(session.user as { email: string; name?: string | null }, token.userId as string)
        }
        
        session.user.id = token.userId as string
        session.user.authProvider = token.authProvider as string
        session.accessToken = token.accessToken as string
        
        // Add access_token to session for use in authenticatedFetch
        ;(session as any).access_token = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})

async function storeUserIfNotExists(user: { email: string; name?: string | null }, userId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL environment variable is required')
      return
    }
    
    // First check if user exists
    const checkResponse = await fetch(`${apiUrl}/api/users/check?email=${encodeURIComponent(user.email)}`)
    if (checkResponse.ok) {
      const checkData = await checkResponse.json()
      if (checkData.exists) {
        // User already exists, don't overwrite
        return
      }
    }
    
    // User doesn't exist, create them
    const response = await fetch(`${apiUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userId,
        email: user.email,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ').slice(1).join(' ') || '',
        auth_provider: 'google',
        email_verified: true, // Google accounts are pre-verified
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to store user:', await response.text())
    }
  } catch (error) {
    console.error('Error storing user:', error)
  }
}

export { handler as GET, handler as POST }