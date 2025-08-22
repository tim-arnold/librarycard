'use client'

import { Typography, Paper, Box, AppBar, Toolbar, Container, Button } from '@mui/material'
import { CreditCard, ArrowBack } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'

export default function TermsPage() {
  const { data: session } = useSession()
  const router = useRouter()

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
          Terms of Use
        </Typography>
        <TermsContent />
      </Paper>
    )
  }

  // If not authenticated, show with branded header and footer
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} /> LibraryCard
          </Typography>
          <Button
            color="inherit"
            onClick={() => router.push('/auth/signin')}
            sx={{ ml: 2 }}
          >
            Sign In
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/auth/signin')}
              variant="text"
              sx={{ minWidth: 'auto' }}
            >
              Back to Sign In
            </Button>
          </Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Terms of Use
          </Typography>
          <TermsContent />
        </Paper>
      </Container>

      <Footer />
    </Box>
  )
}

function TermsContent() {
  return (
    <>
        <Typography variant="body1" paragraph>
          <strong>Last updated:</strong> August 2025
        </Typography>

        <Typography variant="body1" paragraph>
          Welcome to LibraryCard! These Terms of Use govern your access to and use of LibraryCard, 
          a personal library management platform. By using LibraryCard, you agree to these terms.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Acceptable Use
        </Typography>
        <Typography variant="body1" paragraph>
          LibraryCard is designed for personal and institutional library management. You agree to use 
          the service responsibly and in accordance with its intended purpose.
        </Typography>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Permitted Uses
        </Typography>
        <ul>
          <li>Managing your personal book collection and library</li>
          <li>Scanning and cataloging books using ISBN codes</li>
          <li>Creating and organizing locations, shelves, and tags</li>
          <li>Sharing library access with family members or organization members</li>
          <li>Writing respectful book reviews and ratings</li>
          <li>Exporting your library data for backup or migration purposes</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Prohibited Uses
        </Typography>
        <ul>
          <li>Uploading malicious content or attempting to compromise system security</li>
          <li>Using the service for commercial book sales or inventory management without permission</li>
          <li>Submitting false, misleading, or inappropriate book reviews</li>
          <li>Attempting to access other users' private data or accounts</li>
          <li>Overloading the system with automated requests or excessive API usage</li>
          <li>Violating copyright laws when uploading book covers or content</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          User Accounts and Responsibilities
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Account Security
        </Typography>
        <Typography variant="body1" paragraph>
          You are responsible for maintaining the security of your account credentials:
        </Typography>
        <ul>
          <li>Keep your password secure and don't share it with others</li>
          <li>Enable two-factor authentication (2FA) for enhanced security</li>
          <li>Notify administrators immediately of any suspected unauthorized access</li>
          <li>Log out of shared or public computers after use</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          User-Generated Content
        </Typography>
        <Typography variant="body1" paragraph>
          When you submit reviews, ratings, or other content, you represent that:
        </Typography>
        <ul>
          <li>The content is your original work and doesn't violate others' rights</li>
          <li>Reviews are honest and based on your actual experience with the book</li>
          <li>Content doesn't contain offensive, discriminatory, or inappropriate material</li>
          <li>You grant LibraryCard permission to display your content within the platform</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Multi-User Environment Rules
        </Typography>
        <Typography variant="body1" paragraph>
          In shared LibraryCard installations, additional rules apply:
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Administrator Authority
        </Typography>
        <ul>
          <li>Administrators may establish additional usage policies for their library</li>
          <li>Administrators can moderate reviews, manage user access, and enforce content standards</li>
          <li>Administrator decisions regarding content moderation and user management are final</li>
          <li>Users must comply with administrator-established library-specific rules</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Shared Library Etiquette
        </Typography>
        <ul>
          <li>Respect others' book organization systems and location preferences</li>
          <li>Return checked-out books on time or communicate delays</li>
          <li>Use appropriate and professional language in reviews visible to others</li>
          <li>Don't modify or delete other users' book entries without permission</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Service Availability and Limitations
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Service Availability
        </Typography>
        <Typography variant="body1" paragraph>
          While we strive to maintain reliable service:
        </Typography>
        <ul>
          <li>LibraryCard is provided "as-is" without guarantees of uninterrupted availability</li>
          <li>We may perform maintenance that temporarily limits access</li>
          <li>Third-party service dependencies (Google Books API, etc.) may occasionally be unavailable</li>
          <li>We reserve the right to modify features or discontinue services with reasonable notice</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Usage Limits
        </Typography>
        <Typography variant="body1" paragraph>
          To ensure fair usage and system stability:
        </Typography>
        <ul>
          <li>Library size is optimized for up to 10,000+ books per installation</li>
          <li>API requests may be rate-limited to prevent system overload</li>
          <li>File uploads (book covers, OCR images) are subject to size and format restrictions</li>
          <li>Excessive usage that impacts other users may result in temporary restrictions</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Intellectual Property and Content
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Third-Party Content
        </Typography>
        <Typography variant="body1" paragraph>
          LibraryCard integrates with external services for book data:
        </Typography>
        <ul>
          <li>Book metadata comes from Google Books, OpenLibrary, and Library of Congress</li>
          <li>Cover images are sourced from these services under their respective terms</li>
          <li>You may not use LibraryCard to distribute copyrighted content illegally</li>
          <li>Book reviews and personal notes remain your intellectual property</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          LibraryCard Platform
        </Typography>
        <ul>
          <li>The LibraryCard software and interface are protected by copyright</li>
          <li>You may not reverse engineer, copy, or distribute the LibraryCard platform</li>
          <li>Your personal library data belongs to you and can be exported at any time</li>
        </ul>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Account Termination
        </Typography>
        
        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Voluntary Termination
        </Typography>
        <ul>
          <li>You may delete your account at any time through your profile settings</li>
          <li>Account deletion permanently removes your personal data within 30 days</li>
          <li>Exported library data remains yours to keep after account deletion</li>
        </ul>

        <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
          Involuntary Termination
        </Typography>
        <Typography variant="body1" paragraph>
          We may terminate accounts that:
        </Typography>
        <ul>
          <li>Violate these Terms of Use or established usage policies</li>
          <li>Engage in abusive behavior toward other users or administrators</li>
          <li>Attempt to compromise system security or access unauthorized data</li>
          <li>Use the service for prohibited commercial purposes</li>
        </ul>
        <Typography variant="body1" paragraph>
          Before termination, we will typically provide warnings and opportunities to correct violations, 
          except in cases involving security breaches or serious misconduct.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          LibraryCard is provided as a personal library management tool. We are not liable for:
        </Typography>
        <ul>
          <li>Loss of data due to user error, system failure, or third-party service issues</li>
          <li>Inaccurate book metadata from external APIs</li>
          <li>Disputes between users in multi-user environments</li>
          <li>Decisions made by library administrators regarding content or access</li>
          <li>Temporary service interruptions or feature changes</li>
        </ul>
        <Typography variant="body1" paragraph>
          Your use of LibraryCard is at your own risk. We recommend regularly backing up important 
          library data using the export feature.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Changes to These Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We may update these Terms of Use to reflect changes in:
        </Typography>
        <ul>
          <li>LibraryCard features and functionality</li>
          <li>Legal requirements or compliance obligations</li>
          <li>Best practices for platform operation</li>
        </ul>
        <Typography variant="body1" paragraph>
          Significant changes will be communicated through the application or via email. 
          Continued use of LibraryCard after changes constitutes acceptance of the updated terms.
        </Typography>

        <Typography variant="h2" gutterBottom sx={{ mt: 3 }}>
          Contact and Dispute Resolution
        </Typography>
        <Typography variant="body1" paragraph>
          For questions about these terms or to report violations:
        </Typography>
        <ul>
          <li>Contact your library administrator for policy questions in multi-user environments</li>
          <li>Use the in-app contact form for technical support or account issues</li>
          <li>Report security concerns immediately through appropriate channels</li>
        </ul>
        <Typography variant="body1" paragraph>
          We encourage resolving disputes through direct communication and will work with users 
          to address legitimate concerns about service usage or content moderation.
        </Typography>

        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            These Terms of Use are designed to ensure LibraryCard remains a useful, safe, and 
            enjoyable platform for personal library management. Thank you for being part of the 
            LibraryCard community.
          </Typography>
        </Box>
    </>
  )
}