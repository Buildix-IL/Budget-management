import { Typography, Card, CardContent, Box, CircularProgress, Chip, Divider, LinearProgress } from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  RequestQuote as QuoteIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import { useData } from '../context/DataContext'

interface Activity {
  type: string
  description: string
  date: string
  icon: React.ReactNode
  color: string
}

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

  const getProgressPercentage = () => {
    if (statistics.totalDebts === 0) return 0
    return Math.round((statistics.paidAmount / statistics.totalDebts) * 100)
  }

  const getRecentActivity = (): Activity[] => {
    const activities: Activity[] = []
    
    // Recent payments
    const recentPayments = state.payments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    
    recentPayments.forEach(payment => {
      const invoice = state.invoices.find(i => i.id === payment.invoiceId)
      if (invoice) {
        activities.push({
          type: 'payment',
          description: `תשלום ${formatCurrency(payment.amount)} עבור ${invoice.description}`,
          date: payment.createdAt,
          icon: <PaymentIcon color="success" />,
          color: 'success.main'
        })
      }
    })
    
    // Recent invoices
    const recentInvoices = state.invoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    
    recentInvoices.forEach(invoice => {
      const supplier = state.suppliers.find(s => s.id === invoice.supplierId)
      activities.push({
        type: 'invoice',
        description: `חשבונית חדשה: ${invoice.description}${supplier ? ` מ-${supplier.firstName} ${supplier.lastName}` : ''}`,
        date: invoice.createdAt,
        icon: <InvoiceIcon color="info" />,
        color: 'info.main'
      })
    })
    
    // Recent quotes
    const recentQuotes = state.quotes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
    
    recentQuotes.forEach(quote => {
      activities.push({
        type: 'quote',
        description: `הצעת מחיר ${quote.status === 'accepted' ? 'התקבלה' : quote.status === 'rejected' ? 'נדחתה' : 'נוספה'}: ${quote.description}`,
        date: quote.createdAt,
        icon: <QuoteIcon color={quote.status === 'accepted' ? 'success' : quote.status === 'rejected' ? 'error' : 'warning'} />,
        color: quote.status === 'accepted' ? 'success.main' : quote.status === 'rejected' ? 'error.main' : 'warning.main'
      })
    })
    
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }

  const getUpcomingPayments = () => {
    return state.invoices.filter(invoice => {
      if (invoice.status === 'שולם' || invoice.status === 'בוטל') return false
      
      const payments = state.payments.filter(p => p.invoiceId === invoice.id)
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const finalAmount = invoice.amount * (1 + invoice.vat / 100) - 
        (invoice.discountType === 'percentage' 
          ? (invoice.amount * (1 + invoice.vat / 100)) * (invoice.discount / 100)
          : invoice.discount)
      
      return totalPaid < finalAmount
    }).slice(0, 5)
  }

  const recentActivity = getRecentActivity()
  const upcomingPayments = getUpcomingPayments()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 סקירה כללית
      </Typography>
      
      {/* Main Statistics */}
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography color="textSecondary" gutterBottom>
                  סך חובות
                </Typography>
                <TrendingUpIcon color="error" />
              </Box>
              <Typography variant="h4" component="div" color="error.main">
                {formatCurrency(statistics.totalDebts)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {state.invoices.length} חשבוניות
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography color="textSecondary" gutterBottom>
                  שולם
                </Typography>
                <TrendingDownIcon color="success" />
              </Box>
              <Typography variant="h4" component="div" color="success.main">
                {formatCurrency(statistics.paidAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {state.payments.length} תשלומים
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography color="textSecondary" gutterBottom>
                  יתרה לתשלום
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {getProgressPercentage()}%
                </Typography>
              </Box>
              <Typography variant="h4" component="div" color="warning.main">
                {formatCurrency(statistics.remainingAmount)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getProgressPercentage()} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color="warning"
              />
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography color="textSecondary" gutterBottom>
                  הצעות מחיר פעילות
                </Typography>
                <QuoteIcon color="info" />
              </Box>
              <Typography variant="h4" component="div" color="info.main">
                {statistics.activeQuotes}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                מתוך {state.quotes.length} סה"כ
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Secondary Statistics */}
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    ספקים רשומים
                  </Typography>
                  <Typography variant="h5" component="div">
                    {statistics.totalSuppliers}
                  </Typography>
                </Box>
                <BusinessIcon color="action" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                סטטוס הצעות מחיר
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip 
                  label={`ממתינות: ${state.quotes.filter(q => q.status === 'pending').length}`}
                  size="small"
                  color="warning"
                />
                <Chip 
                  label={`התקבלו: ${state.quotes.filter(q => q.status === 'accepted').length}`}
                  size="small"
                  color="success"
                />
                <Chip 
                  label={`נדחו: ${state.quotes.filter(q => q.status === 'rejected').length}`}
                  size="small"
                  color="error"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      {/* Recent Activity & Upcoming Payments */}
      <Box display="flex" flexWrap="wrap" gap={3}>
        <Box flex="1" minWidth="300px">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                פעילות אחרונה
              </Typography>
              {recentActivity.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  עדיין לא הוזנו נתונים במערכת. התחל בהוספת ספקים!
                </Typography>
              ) : (
                <Box>
                  {recentActivity.map((activity, index) => (
                    <Box key={index} sx={{ mb: index < recentActivity.length - 1 ? 2 : 0 }}>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        {activity.icon}
                        <Box flex="1">
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.date).toLocaleDateString('he-IL')}
                          </Typography>
                        </Box>
                      </Box>
                      {index < recentActivity.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="300px">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                חשבוניות ממתינות לתשלום
              </Typography>
              {upcomingPayments.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  כל החשבוניות שולמו! 🎉
                </Typography>
              ) : (
                <Box>
                  {upcomingPayments.map((invoice, index) => {
                    const supplier = state.suppliers.find(s => s.id === invoice.supplierId)
                    const payments = state.payments.filter(p => p.invoiceId === invoice.id)
                    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
                    const finalAmount = invoice.amount * (1 + invoice.vat / 100) - 
                      (invoice.discountType === 'percentage' 
                        ? (invoice.amount * (1 + invoice.vat / 100)) * (invoice.discount / 100)
                        : invoice.discount)
                    const remainingAmount = finalAmount - totalPaid
                    
                    return (
                      <Box key={invoice.id} sx={{ mb: index < upcomingPayments.length - 1 ? 2 : 0 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {invoice.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {supplier ? `${supplier.firstName} ${supplier.lastName}` : 'ספק לא ידוע'}
                          </Typography>
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            {formatCurrency(remainingAmount)}
                          </Typography>
                        </Box>
                        {index < upcomingPayments.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default Dashboard 