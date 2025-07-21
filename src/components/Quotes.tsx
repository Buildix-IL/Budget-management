import { Typography, Box } from '@mui/material'

const Quotes = () => {
  return (
    <Box dir="rtl" sx={{ textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ direction: 'rtl', textAlign: 'right' }}>
        💼 הצעות מחיר
      </Typography>
      <Typography variant="body1" sx={{ direction: 'rtl', textAlign: 'right' }}>
        ...בקרוב
      </Typography>
    </Box>
  )
}

export default Quotes 