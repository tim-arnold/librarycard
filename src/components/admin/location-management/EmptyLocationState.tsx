import { Button } from '@mui/material'
import { Add } from '@mui/icons-material'

interface EmptyLocationStateProps {
  userRole: string | null
  onCreateLocation: () => void
}

export default function EmptyLocationState({ userRole, onCreateLocation }: EmptyLocationStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        {userRole === 'super_admin'
          ? "You don't have any locations yet. Create your first location to start organizing your books!"
          : "No locations are available. Contact a super administrator to create locations."
        }
      </p>
      {userRole === 'super_admin' && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreateLocation}
        >
          Create Your First Location
        </Button>
      )}
    </div>
  )
}
