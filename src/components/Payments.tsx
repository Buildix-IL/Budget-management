import { useState } from 'react'
import {
  Typography, Box, Button, Card, CardContent,
  TextField, InputAdornment, Fab, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert,
  IconButton, Menu, MenuItem, Divider, Select,
  FormControl, InputLabel
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Receipt as InvoiceIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { useData } from '../context/DataContext'
import type { Payment, PaymentFormData, PaymentMethod } from '../types'

const Payments = () => {
  const { state, addPayment, deletePayment, getSupplierById, getInvoiceById, getUnpaidInvoices } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    invoiceId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    reference: '',
    notes: ''
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuPaymentId, setMenuPaymentId] = useState<string | null>(null)

  // Filter payments based on search and method
  const filteredPayments = state.payments.filter(payment => {
    const invoice = getInvoiceById(payment.invoiceId)
    const supplier = invoice ? getSupplierById(invoice.supplierId) : null
    const supplierName = supplier ? `${supplier.firstName} ${supplier.lastName} ${supplier.companyName || ''}`.trim() : ''
    
    const matchesSearch = (
      (invoice && invoice.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    
    return matchesSearch && matchesMethod
  })

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setFormData({
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference || '',
        notes: payment.notes || ''
      })
    } else {
      setFormData({
        invoiceId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference: '',
        notes: ''
      })
    }
    setFormErrors([])
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setFormErrors([])
    setAnchorEl(null)
    setMenuPaymentId(null)
  }

  const handleSubmit = () => {
    const errors = validatePayment(formData)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    addPayment(formData)
    handleCloseDialog()
  }

  const validatePayment = (data: PaymentFormData): string[] => {
    const errors: string[] = []
    if (!data.invoiceId) errors.push('חשבונית חובה')
    if (data.amount <= 0) errors.push('סכום חובה וחייב להיות חיובי')
    if (!data.date) errors.push('תאריך חובה')
    if (!data.method) errors.push('אמצעי תשלום חובה')
    
    // Check if payment amount doesn't exceed remaining amount
    const invoice = getInvoiceById(data.invoiceId)
    if (invoice) {
      const finalAmount = calculateFinalAmount(invoice)
      const existingPayments = state.payments
        .filter(p => p.invoiceId === data.invoiceId)
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingAmount = finalAmount - existingPayments
      
      if (data.amount > remainingAmount) {
        errors.push(`סכום התשלום גדול מהיתרה לתשלום (${formatCurrency(remainingAmount)})`)
      }
    }
    
    return errors
  }

  const handleDelete = (paymentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תשלום זה?')) {
      deletePayment(paymentId)
      handleCloseDialog()
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, paymentId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuPaymentId(paymentId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuPaymentId(null)
  }

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = getInvoiceById(invoiceId)
    if (invoice) {
      const finalAmount = calculateFinalAmount(invoice)
      const existingPayments = state.payments
        .filter(p => p.invoiceId === invoiceId)
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingAmount = finalAmount - existingPayments
      
      setFormData({
        ...formData,
        invoiceId,
        amount: remainingAmount > 0 ? remainingAmount : 0
      })
    } else {
      setFormData({
        ...formData,
        invoiceId,
        amount: 0
      })
    }
  }

  const calculateFinalAmount = (invoice: any) => {
    const vatAmount = invoice.amount * (invoice.vat / 100)
    const grossAmount = invoice.amount + vatAmount
    const discountAmount = invoice.discountType === 'percentage' 
      ? grossAmount * (invoice.discount / 100)
      : invoice.discount
    return grossAmount - discountAmount
  }

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer': return <BankIcon fontSize="small" />
      case 'cash': return <CashIcon fontSize="small" />
      case 'check': return <CheckIcon fontSize="small" />
      case 'credit_card': return <CreditCardIcon fontSize="small" />
      default: return <PaymentIcon fontSize="small" />
    }
  }

  const getMethodText = (method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer': return 'העברה בנקאית'
      case 'cash': return 'מזומן'
      case 'check': return 'צק'
      case 'credit_card': return 'כרטיס אשראי'
      case 'other': return 'אחר'
      default: return method
    }
  }

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₪', '') + ' ₪'
  }

  const getSupplierDisplayName = (supplierId: string) => {
    const supplier = getSupplierById(supplierId)
    if (!supplier) return 'ספק לא ידוע'
    
    const fullName = `${supplier.firstName} ${supplier.lastName}`.trim()
    return supplier.companyName ? `${fullName} (${supplier.companyName})` : fullName
  }

  const getUnpaidInvoicesWithDetails = () => {
    return getUnpaidInvoices().map(invoice => {
      const supplier = getSupplierById(invoice.supplierId)
      const finalAmount = calculateFinalAmount(invoice)
      const existingPayments = state.payments
        .filter(p => p.invoiceId === invoice.id)
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingAmount = finalAmount - existingPayments
      
      return {
        ...invoice,
        supplier,
        finalAmount,
        remainingAmount
      }
    }).filter(invoice => invoice.remainingAmount > 0)
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          💰 תשלומים
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          הוסף תשלום
        </Button>
      </Box>

      {/* Search and Filter bar */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <TextField
          placeholder="חיפוש תשלומים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>אמצעי תשלום</InputLabel>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            label="אמצעי תשלום"
          >
            <MenuItem value="all">כל האמצעים</MenuItem>
            <MenuItem value="bank_transfer">העברה בנקאית</MenuItem>
            <MenuItem value="cash">מזומן</MenuItem>
            <MenuItem value="check">צק</MenuItem>
            <MenuItem value="credit_card">כרטיס אשראי</MenuItem>
            <MenuItem value="other">אחר</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Statistics */}
      <Box mb={3}>
        <Chip 
          label={`סך הכל: ${state.payments.length} תשלומים`}
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`סך שולם: ${formatCurrency(state.payments.reduce((sum, p) => sum + p.amount, 0))}`}
          color="success"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`חשבוניות ממתינות: ${getUnpaidInvoicesWithDetails().length}`}
          color="warning"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        {searchTerm && (
          <Chip 
            label={`נמצאו: ${filteredPayments.length} תוצאות`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Payments Grid */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || methodFilter !== 'all' ? 'לא נמצאו תשלומים התואמים לסינון' : 'עדיין לא הוספת תשלומים'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm || methodFilter !== 'all' ? 'נסה לשנות את הסינון או החיפוש' : 'התחל בהוספת התשלום הראשון שלך'}
            </Typography>
            {!searchTerm && methodFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                הוסף תשלום ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box 
          display="grid" 
          gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))" 
          gap={3}
        >
          {filteredPayments.map((payment) => {
            const invoice = getInvoiceById(payment.invoiceId)
            const supplier = invoice ? getSupplierById(invoice.supplierId) : null
            
            return (
              <Card key={payment.id} sx={{ height: 'fit-content', position: 'relative' }}>
                <CardContent>
                  {/* Menu button */}
                  <IconButton
                    sx={{ position: 'absolute', top: 8, left: 8 }}
                    onClick={(e) => handleMenuOpen(e, payment.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>

                  {/* Payment method chip */}
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Chip
                      icon={getMethodIcon(payment.method)}
                      label={getMethodText(payment.method)}
                      size="small"
                      color="primary"
                    />
                  </Box>

                  <Typography variant="h5" gutterBottom color="success.main">
                    {formatCurrency(payment.amount)}
                  </Typography>

                  {invoice && (
                    <>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <InvoiceIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {invoice.description}
                        </Typography>
                      </Box>

                      {supplier && (
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {getSupplierDisplayName(supplier.id)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                  
                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      תאריך תשלום:
                    </Typography>
                    <Typography variant="body2">
                      {formatCreatedDate(payment.date)}
                    </Typography>
                  </Box>

                  {payment.reference && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        אסמכתא:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {payment.reference}
                      </Typography>
                    </Box>
                  )}

                  {payment.notes && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {payment.notes}
                      </Typography>
                    </>
                  )}

                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="caption" color="text.secondary">
                    נוצר: {formatCreatedDate(payment.createdAt)}
                  </Typography>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            if (menuPaymentId) handleDelete(menuPaymentId)
            handleMenuClose()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ ml: 1 }} />
          מחק
        </MenuItem>
      </Menu>

      {/* Add Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          הוסף תשלום חדש
        </DialogTitle>
        <DialogContent>
          {formErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <ul style={{ margin: 0, paddingRight: 20 }}>
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>חשבונית *</InputLabel>
              <Select
                value={formData.invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                label="חשבונית *"
                error={formErrors.some(e => e.includes('חשבונית'))}
              >
                {getUnpaidInvoicesWithDetails().map((invoice) => (
                  <MenuItem key={invoice.id} value={invoice.id}>
                    <Box>
                      <Typography variant="body1">
                        {invoice.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.supplier && getSupplierDisplayName(invoice.supplier.id)} • 
                        נותר לתשלום: {formatCurrency(invoice.remainingAmount)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" gap={2}>
              <TextField
                label="סכום תשלום *"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                error={formErrors.some(e => e.includes('סכום'))}
                helperText={formErrors.find(e => e.includes('סכום'))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₪</InputAdornment>
                }}
                sx={{ minWidth: 200 }}
              />
              
              <TextField
                label="תאריך תשלום *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={formErrors.some(e => e.includes('תאריך'))}
                helperText={formErrors.find(e => e.includes('תאריך'))}
                sx={{ minWidth: 200 }}
              />
            </Box>

            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>אמצעי תשלום *</InputLabel>
                <Select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                  label="אמצעי תשלום *"
                  error={formErrors.some(e => e.includes('אמצעי'))}
                >
                  <MenuItem value="bank_transfer">העברה בנקאית</MenuItem>
                  <MenuItem value="cash">מזומן</MenuItem>
                  <MenuItem value="check">צק</MenuItem>
                  <MenuItem value="credit_card">כרטיס אשראי</MenuItem>
                  <MenuItem value="other">אחר</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="מספר אסמכתא"
                placeholder="לדוגמה: 123456789"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                sx={{ minWidth: 200 }}
                helperText="מספר העברה, צק, או אסמכתא אחרת"
              />
            </Box>
            
            <TextField
              fullWidth
              label="הערות"
              placeholder="הערות נוספות על התשלום..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
            />

            {/* Payment Summary */}
            {formData.invoiceId && (
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  סיכום תשלום:
                </Typography>
                {(() => {
                  const invoice = getInvoiceById(formData.invoiceId)
                  if (!invoice) return null
                  
                  const finalAmount = calculateFinalAmount(invoice)
                  const existingPayments = state.payments
                    .filter(p => p.invoiceId === formData.invoiceId)
                    .reduce((sum, p) => sum + p.amount, 0)
                  const remainingAmount = finalAmount - existingPayments
                  const afterPayment = remainingAmount - formData.amount
                  
                  return (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">סכום חשבונית:</Typography>
                        <Typography variant="body2">{formatCurrency(finalAmount)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">שולם עד כה:</Typography>
                        <Typography variant="body2">{formatCurrency(existingPayments)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">נותר לתשלום:</Typography>
                        <Typography variant="body2" color="warning.main">
                          {formatCurrency(remainingAmount)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6">יתרה לאחר תשלום:</Typography>
                        <Typography 
                          variant="h6" 
                          color={afterPayment <= 0 ? 'success.main' : 'warning.main'}
                        >
                          {formatCurrency(Math.max(0, afterPayment))}
                        </Typography>
                      </Box>
                    </>
                  )
                })()}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.invoiceId || formData.amount <= 0 || !formData.date}
          >
            הוסף תשלום
          </Button>
          <Button onClick={handleCloseDialog}>
            ביטול
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

export default Payments 