'use client'

import { Typography, Paper, Box, Container, Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import GlobalHeader from '@/components/layout/GlobalHeader'
import { useUserData } from '@/contexts/UserDataContext'

export default function PrivacyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { userRole, userFirstName } = useUserData()

  // If authenticated, show with normal AppLayout styling
  if (session) {
    return (
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            variant="text"
            sx={{ minWidth: 'auto' }}
          >
            Back to Library
          </Button>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        <PrivacyContent />
      </Paper>
    )
  }

  // If not authenticated, show with GlobalHeader and footer
  return (
    <>
      <GlobalHeader
        userRole={userRole}
        userFirstName={userFirstName}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Privacy Policy
          </Typography>
          <PrivacyContent />
        </Paper>
      </Container>

      <Footer />
    </>
  )
}

function PrivacyContent() {
  return (
    <>

      <Typography variant="body1" paragraph>
          <strong>Last updated:</strong> August 2025
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Information Collection and Use
        </Typography>
        <Typography variant="body1" paragraph>
          LibraryCard is a personal library management application supporting individual users and 
          multi-user environments. We collect and store information you provide to help you manage 
          your book collection, including:
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Account Information
        </Typography>
        <ul>
          <li>Basic profile data (name, email) for authentication</li>
          <li>Authentication credentials (encrypted passwords for email/password accounts)</li>
          <li>Two-factor authentication settings (TOTP secrets, backup codes) when enabled</li>
          <li>WebAuthn credentials for passwordless authentication when enabled</li>
          <li>Account role and permissions (admin/user)</li>
          <li>Sign-up approval status and admin review history</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Library Content
        </Typography>
        <ul>
          <li>Book data you add to your library (titles, authors, ISBNs, descriptions, covers)</li>
          <li>Location and shelf information you create or manage</li>
          <li>Custom tags and genre assignments</li>
          <li>Check-out records and due dates</li>
          <li>Book ratings and reviews you submit</li>
          <li>Cover image selections and metadata</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Usage and Preferences
        </Typography>
        <ul>
          <li>Interface preferences (theme, view modes, filter settings)</li>
          <li>Notification preferences and delivery settings</li>
          <li>Performance and analytics data for Core Web Vitals monitoring</li>
          <li>Search queries and browsing patterns within your library</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Cookies and Local Storage
        </Typography>
        <Typography variant="body1" paragraph>
          We use cookies and browser local storage to enhance your experience:
        </Typography>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Essential Cookies (Required)
        </Typography>
        <ul>
          <li><strong>Authentication cookies:</strong> Provided by NextAuth.js to maintain your login session</li>
          <li><strong>Security cookies:</strong> CSRF protection and callback URL management</li>
        </ul>
        <Typography variant="body1" paragraph>
          These cookies are essential for the application to function and cannot be disabled.
        </Typography>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Functional Storage (Optional)
        </Typography>
        <ul>
          <li><strong>Theme preference:</strong> Remembers your dark/light mode setting</li>
          <li><strong>View preferences:</strong> Remembers your preferred book view (card/list)</li>
          <li><strong>Interface settings:</strong> Remembers your last selected shelf and active tabs</li>
          <li><strong>Offline fallback:</strong> Temporary book data storage when the server is unavailable</li>
        </ul>
        <Typography variant="body1" paragraph>
          You can disable functional storage through our cookie consent banner. The app will 
          continue to work, but won&apos;t remember your preferences between sessions.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Data Storage and Security
        </Typography>
        <Typography variant="body1" paragraph>
          Your library data is stored securely in our database. We use industry-standard 
          security practices including encrypted connections and secure authentication.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Third-Party Services and Data Processing
        </Typography>
        <Typography variant="body1" paragraph>
          We integrate with external services to enhance your library management experience. 
          Here's how your data is processed:
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Book Data Services
        </Typography>
        <ul>
          <li><strong>Google Books API:</strong> ISBN and search queries are sent to fetch book metadata, descriptions, and cover images. No personal information is shared.</li>
          <li><strong>OpenLibrary:</strong> ISBN lookups for additional book metadata and alternative cover images. Queries are anonymous.</li>
          <li><strong>Library of Congress:</strong> Book classification and subject data lookups. No personal data is transmitted.</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Authentication Services
        </Typography>
        <ul>
          <li><strong>Google OAuth:</strong> If you choose Google sign-in, we receive your basic profile information (name, email, profile image). Your Google account remains under your control.</li>
          <li><strong>NextAuth.js:</strong> Handles authentication sessions and security tokens. All data is encrypted and stored securely.</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Advanced Features
        </Typography>
        <ul>
          <li><strong>Google Vision API:</strong> When you upload bookshelf photos for OCR scanning, images are processed to extract book titles and authors. Images are not permanently stored by Google or LibraryCard.</li>
          <li><strong>Cloudflare:</strong> Hosts our API and database infrastructure. All data is encrypted in transit and at rest.</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Data Retention and Deletion
        </Typography>
        <Typography variant="body1" paragraph>
          We retain your data only as long as necessary to provide LibraryCard services:
        </Typography>
        <ul>
          <li><strong>Active accounts:</strong> Data is retained indefinitely while your account is active</li>
          <li><strong>Inactive accounts:</strong> Account data may be archived after 2 years of inactivity</li>
          <li><strong>Deleted accounts:</strong> All personal data is permanently deleted within 30 days of account deletion</li>
          <li><strong>Review moderation:</strong> Rejected or deleted reviews are purged after 90 days</li>
          <li><strong>Authentication logs:</strong> Security logs are retained for 1 year for audit purposes</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Multi-User Environments
        </Typography>
        <Typography variant="body1" paragraph>
          In shared LibraryCard installations, additional privacy considerations apply:
        </Typography>
        <ul>
          <li><strong>Admin visibility:</strong> Library administrators can view all books, locations, and user activity within the shared library</li>
          <li><strong>Review moderation:</strong> Administrators can view, approve, or reject book reviews and ratings</li>
          <li><strong>User management:</strong> Administrators can manage user accounts, roles, and permissions</li>
          <li><strong>Data sharing:</strong> Your library activity (books added, check-outs) is visible to other users in the same library</li>
          <li><strong>Content policies:</strong> Administrators may establish rules for appropriate use and content</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Your Rights and Controls
        </Typography>
        <Typography variant="body1" paragraph>
          You have the following rights regarding your data:
        </Typography>
        <ul>
          <li><strong>Access:</strong> View all your personal data through your profile and settings</li>
          <li><strong>Correction:</strong> Update inaccurate information in your profile at any time</li>
          <li><strong>Deletion:</strong> Delete your account and all associated data</li>
          <li><strong>Export:</strong> Download your complete library data in JSON format</li>
          <li><strong>Cookie control:</strong> Manage functional storage preferences through our consent banner</li>
          <li><strong>Two-factor authentication:</strong> Enable or disable 2FA and manage backup codes</li>
          <li><strong>Notification preferences:</strong> Control email notifications and in-app alerts</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Contact Information
        </Typography>
        <Typography variant="body1" paragraph>
          If you have questions about this privacy policy or your data, please contact us 
          through the app&apos;s contact form or at the email address provided in your account settings.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Changes to This Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this privacy policy from time to time. We will notify users of any 
          significant changes through the application or via email.
        </Typography>

        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            This privacy policy is part of LibraryCard&apos;s commitment to transparency and user privacy.
          </Typography>
        </Box>
    </>
  )
}