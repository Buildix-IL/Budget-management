import { Typography, Box } from '@mui/material'

const Settings = () => {
  return (
    <Box dir="rtl" sx={{ textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ direction: 'rtl', textAlign: 'right' }}>
        ⚙️ הגדרות
      </Typography>
      <Typography variant="body1" sx={{ direction: 'rtl', textAlign: 'right' }}>
        ...בקרוב
      </Typography>
    </Box>
  )
}

export default Settings 