import { Typography, Card, CardContent, Box, CircularProgress } from '@mui/material'
import { useData } from '../context/DataContext'

const Dashboard = () => {
  const { state } = useData()

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    )
  }

  const { statistics } = state

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₪', '') + ' ₪'
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 סקירה כללית
      </Typography>
      
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                סך חובות
              </Typography>
              <Typography variant="h5" component="div" color="error.main">
                {formatCurrency(statistics.totalDebts)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                שולם
              </Typography>
              <Typography variant="h5" component="div" color="success.main">
                {formatCurrency(statistics.paidAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                יתרה לתשלום
              </Typography>
              <Typography variant="h5" component="div" color="warning.main">
                {formatCurrency(statistics.remainingAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                הצעות מחיר פעילות
              </Typography>
              <Typography variant="h5" component="div" color="info.main">
                {statistics.activeQuotes}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                סך חשבוניות
              </Typography>
              <Typography variant="h5" component="div">
                {statistics.totalInvoices}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                סך ספקים
              </Typography>
              <Typography variant="h5" component="div">
                {statistics.totalSuppliers}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            פעילות אחרונה
          </Typography>
          {state.invoices.length === 0 && state.suppliers.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              עדיין לא הוזנו נתונים במערכת. התחל בהוספת ספקים!
            </Typography>
          ) : (
            <Box>
              {state.invoices.length > 0 && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 {state.invoices.length} חשבוניות במערכת
                </Typography>
              )}
              {state.suppliers.length > 0 && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🏢 {state.suppliers.length} ספקים במערכת
                </Typography>
              )}
              {state.payments.length > 0 && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  💰 {state.payments.length} תשלומים בוצעו
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard 