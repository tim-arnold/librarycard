/**
 * Better Auth PoC Test Page
 *
 * This page allows testing Better Auth functionality during the evaluation.
 * It should NOT be deployed to production.
 */

'use client';

import { useState } from 'react';
import {
  useSession,
  signIn,
  signUp,
  signOut,
  authClient
} from '@/lib/better-auth-client';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';

export default function PoCAuthTestPage() {
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailSignUp = async () => {
    try {
      setMessage('');
      const result = await signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
      });

      if (result.error) {
        setMessage(`Sign up error: ${result.error.message}`);
      } else {
        setMessage('Sign up successful! Check your email for verification.');
      }
    } catch (error) {
      setMessage(`Sign up failed: ${error}`);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setMessage('');
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setMessage(`Sign in error: ${result.error.message}`);
      } else {
        setMessage('Sign in successful!');
      }
    } catch (error) {
      setMessage(`Sign in failed: ${error}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setMessage('');
      const result = await signIn.social({
        provider: 'google',
      });

      if (result.error) {
        setMessage(`Google sign in error: ${result.error.message}`);
      }
    } catch (error) {
      setMessage(`Google sign in failed: ${error}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMessage('Signed out successfully');
    } catch (error) {
      setMessage(`Sign out failed: ${error}`);
    }
  };

  if (isPending) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading session...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Better Auth PoC Test Page
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          LCWEB-163: Evaluate LibraryCard Auth System vs Modern Open Source Alternatives
        </Typography>

        {message && (
          <Alert severity={message.includes('error') || message.includes('failed') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {session?.user ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Session
              </Typography>
              <Typography><strong>User ID:</strong> {session.user.id}</Typography>
              <Typography><strong>Email:</strong> {session.user.email}</Typography>
              <Typography><strong>Name:</strong> {session.user.name || 'Not set'}</Typography>
              <Typography><strong>Email Verified:</strong> {session.user.emailVerified ? 'Yes' : 'No'}</Typography>
              <Typography><strong>Created:</strong> {new Date(session.user.createdAt).toLocaleString()}</Typography>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Email/Password Authentication
              </Typography>

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleEmailSignIn}
                  disabled={!email || !password}
                >
                  Sign In
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleEmailSignUp}
                  disabled={!email || !password || !firstName}
                >
                  Sign Up
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                OAuth Authentication
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGoogleSignIn}
                sx={{ mr: 2 }}
              >
                Sign In with Google
              </Button>
            </Box>
          </>
        )}

        <Alert severity="warning" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>PoC Notice:</strong> This is a proof-of-concept test page for evaluating Better Auth.
            It should not be accessible in production and will be removed after the evaluation is complete.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}