import { Typography, Box } from '@mui/material'

const Invoices = () => {
  return (
    <Box dir="rtl" sx={{ textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ direction: 'rtl', textAlign: 'right' }}>
        📄 חשבוניות
      </Typography>
      <Typography variant="body1" sx={{ direction: 'rtl', textAlign: 'right' }}>
        ...בקרוב
      </Typography>
    </Box>
  )
}

export default Invoices 