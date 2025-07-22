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
  Receipt as InvoiceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Payment as PaymentIcon,
  RequestQuote as QuoteIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import { useData } from '../context/DataContext'
import type { Invoice, InvoiceFormData, InvoiceStatus } from '../types'

const Invoices = () => {
  const { state, addInvoice, updateInvoice, deleteInvoice, getSupplierById, addPayment } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<InvoiceFormData>({
    supplierId: '',
    quoteId: '',
    description: '',
    amount: 0,
    vat: 18,
    discount: 0,
    discountType: 'amount',
    status: 'ממתין לתשלום',
    dueDate: '',
    paymentBreakdown: [],
    notes: ''
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuInvoiceId, setMenuInvoiceId] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'bank_transfer' as const,
    reference: '',
    notes: ''
  })

  // Filter invoices based on search and status
  const filteredInvoices = state.invoices.filter(invoice => {
    const supplier = getSupplierById(invoice.supplierId)
    const supplierName = supplier ? `${supplier.firstName} ${supplier.lastName} ${supplier.companyName || ''}`.trim() : ''
    const quote = invoice.quoteId ? state.quotes.find(q => q.id === invoice.quoteId) : null
    
    const matchesSearch = (
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote && quote.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice)
      setFormData({
        supplierId: invoice.supplierId,
        quoteId: invoice.quoteId || '',
        description: invoice.description,
        amount: invoice.amount,
        vat: invoice.vat,
        discount: invoice.discount,
        discountType: invoice.discountType,
        status: invoice.status,
        dueDate: invoice.dueDate || '',
        paymentBreakdown: invoice.paymentBreakdown,
        notes: invoice.notes || ''
      })
      setIsEditMode(true)
    } else {
      setSelectedInvoice(null)
      setFormData({
        supplierId: '',
        quoteId: '',
        description: '',
        amount: 0,
        vat: state.settings.defaultVat,
        discount: 0,
        discountType: 'amount',
        status: 'ממתין לתשלום',
        dueDate: '',
        paymentBreakdown: [],
        notes: ''
      })
      setIsEditMode(false)
    }
    setFormErrors([])
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedInvoice(null)
    setFormErrors([])
    setAnchorEl(null)
    setMenuInvoiceId(null)
  }

  const handleSubmit = () => {
    const errors = validateInvoice(formData)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    if (isEditMode && selectedInvoice) {
      updateInvoice(selectedInvoice.id, formData)
    } else {
      addInvoice(formData)
    }
    
    handleCloseDialog()
  }

  const validateInvoice = (data: InvoiceFormData): string[] => {
    const errors: string[] = []
    if (!data.supplierId) errors.push('ספק חובה')
    if (!data.description?.trim()) errors.push('תיאור חובה')
    if (data.amount <= 0) errors.push('סכום חובה וחייב להיות חיובי')
    if (data.vat < 0 || data.vat > 100) errors.push('אחוז המע"מ חייב להיות בין 0 ל-100')
    if (data.discount < 0) errors.push('הנחה לא יכולה להיות שלילית')
    return errors
  }

  const handleDelete = (invoiceId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק חשבונית זו?')) {
      deleteInvoice(invoiceId)
      handleCloseDialog()
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoiceId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuInvoiceId(invoiceId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuInvoiceId(null)
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = getSupplierById(supplierId)
    setFormData({
      ...formData,
      supplierId,
      vat: supplier?.defaultVat || state.settings.defaultVat,
      quoteId: '' // Clear quote when changing supplier
    })
  }

  const handleQuoteChange = (quoteId: string) => {
    const quote = state.quotes.find(q => q.id === quoteId)
    if (quote) {
      setFormData({
        ...formData,
        quoteId,
        description: quote.description,
        amount: quote.amount
      })
    } else {
      setFormData({
        ...formData,
        quoteId: ''
      })
    }
  }

  const getStatusColor = (status: InvoiceStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'שולם': return 'success'
      case 'שולם חלקית': return 'warning'
      case 'ממתין לתשלום': return 'info'
      case 'בוטל': return 'error'
      case 'באמצע ביצוע': return 'primary'
      default: return 'default'
    }
  }

  const calculateFinalAmount = (invoice: Invoice) => {
    const vatAmount = invoice.amount * (invoice.vat / 100)
    const grossAmount = invoice.amount + vatAmount
    const discountAmount = invoice.discountType === 'percentage' 
      ? grossAmount * (invoice.discount / 100)
      : invoice.discount
    return grossAmount - discountAmount
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

  const getAvailableQuotes = (supplierId: string) => {
    return state.quotes.filter(q => q.supplierId === supplierId && q.status === 'accepted')
  }

  const handleAddPayment = (invoice: Invoice) => {
    const finalAmount = calculateFinalAmount(invoice)
    const existingPayments = state.payments
      .filter(p => p.invoiceId === invoice.id)
      .reduce((sum, p) => sum + p.amount, 0)
    const remainingAmount = finalAmount - existingPayments
    
    setSelectedInvoiceForPayment(invoice)
    setPaymentFormData({
      amount: remainingAmount > 0 ? remainingAmount : 0,
      date: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      reference: '',
      notes: ''
    })
    setPaymentDialogOpen(true)
  }

  const handlePaymentSubmit = () => {
    if (!selectedInvoiceForPayment) return

    const paymentData = {
      invoiceId: selectedInvoiceForPayment.id,
      amount: paymentFormData.amount,
      date: paymentFormData.date,
      method: paymentFormData.method,
      reference: paymentFormData.reference,
      notes: paymentFormData.notes
    }

    addPayment(paymentData)
    setPaymentDialogOpen(false)
    setSelectedInvoiceForPayment(null)
    handleMenuClose()
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          📄 חשבוניות
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          הוסף חשבונית
        </Button>
      </Box>

      {/* Search and Filter bar */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <TextField
          placeholder="חיפוש חשבוניות..."
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
          <InputLabel>סטטוס</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="סטטוס"
          >
            <MenuItem value="all">כל הסטטוסים</MenuItem>
            {state.settings.statuses.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Statistics */}
      <Box mb={3}>
        <Chip 
          label={`סך הכל: ${state.invoices.length} חשבוניות`}
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`ממתינות לתשלום: ${state.invoices.filter(i => i.status === 'ממתין לתשלום').length}`}
          color="info"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`שולמו: ${state.invoices.filter(i => i.status === 'שולם').length}`}
          color="success"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        {searchTerm && (
          <Chip 
            label={`נמצאו: ${filteredInvoices.length} תוצאות`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Invoices Grid */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <InvoiceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו חשבוניות התואמות לסינון' : 'עדיין לא הוספת חשבוניות'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm || statusFilter !== 'all' ? 'נסה לשנות את הסינון או החיפוש' : 'התחל בהוספת החשבונית הראשונה שלך'}
            </Typography>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                הוסף חשבונית ראשונה
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box 
          display="grid" 
          gridTemplateColumns="repeat(auto-fill, minmax(350px, 1fr))" 
          gap={3}
        >
          {filteredInvoices.map((invoice) => {
            const quote = invoice.quoteId ? state.quotes.find(q => q.id === invoice.quoteId) : null
            const finalAmount = calculateFinalAmount(invoice)
            const payments = state.payments.filter(p => p.invoiceId === invoice.id)
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
            
            return (
              <Card key={invoice.id} sx={{ height: 'fit-content', position: 'relative' }}>
                <CardContent>
                  {/* Menu button */}
                  <IconButton
                    sx={{ position: 'absolute', top: 8, left: 8 }}
                    onClick={(e) => handleMenuOpen(e, invoice.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>

                  {/* Status chip */}
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom noWrap>
                    {invoice.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {getSupplierDisplayName(invoice.supplierId)}
                    </Typography>
                  </Box>

                  {quote && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <QuoteIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        מהצעת מחיר: {quote.description}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      סכום בסיס:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.amount)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      מע"מ ({invoice.vat}%):
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.amount * (invoice.vat / 100))}
                    </Typography>
                  </Box>

                  {invoice.discount > 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        הנחה:
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        -{invoice.discountType === 'percentage' 
                          ? `${invoice.discount}%` 
                          : formatCurrency(invoice.discount)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="primary">
                      סך לתשלום:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(finalAmount)}
                    </Typography>
                  </Box>

                  {payments.length > 0 && (
                    <>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="success.main">
                          שולם:
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(totalPaid)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="warning.main">
                          נותר לתשלום:
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          {formatCurrency(finalAmount - totalPaid)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {invoice.dueDate && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      תאריך יעד: {formatCreatedDate(invoice.dueDate)}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    נוצר: {formatCreatedDate(invoice.createdAt)}
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
            const invoice = state.invoices.find(i => i.id === menuInvoiceId)
            if (invoice) handleOpenDialog(invoice)
            handleMenuClose()
          }}
        >
          <EditIcon sx={{ ml: 1 }} />
          ערוך
        </MenuItem>
        <MenuItem 
          onClick={() => {
            const invoice = state.invoices.find(i => i.id === menuInvoiceId)
            if (invoice) handleAddPayment(invoice)
          }}
        >
          <PaymentIcon sx={{ ml: 1 }} />
          הוסף תשלום
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuInvoiceId) handleDelete(menuInvoiceId)
            handleMenuClose()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ ml: 1 }} />
          מחק
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'ערוך חשבונית' : 'הוסף חשבונית חדשה'}
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
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>ספק *</InputLabel>
                <Select
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  label="ספק *"
                  error={formErrors.some(e => e.includes('ספק'))}
                >
                  {state.suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {getSupplierDisplayName(supplier.id)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>הצעת מחיר (אופציונלי)</InputLabel>
                <Select
                  value={formData.quoteId}
                  onChange={(e) => handleQuoteChange(e.target.value)}
                  label="הצעת מחיר (אופציונלי)"
                  disabled={!formData.supplierId}
                >
                  <MenuItem value="">ללא הצעת מחיר</MenuItem>
                  {getAvailableQuotes(formData.supplierId).map((quote) => (
                    <MenuItem key={quote.id} value={quote.id}>
                      {quote.description} - {formatCurrency(quote.amount)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="תיאור העבודה *"
              placeholder="לדוגמה: שיפוץ חדר אמבטיה"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={formErrors.some(e => e.includes('תיאור'))}
              helperText={formErrors.find(e => e.includes('תיאור'))}
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="סכום בסיס *"
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
                sx={{ minWidth: 150 }}
              />
              
              <TextField
                label="מע״מ (%)"
                type="number"
                value={formData.vat}
                onChange={(e) => setFormData({ ...formData, vat: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                error={formErrors.some(e => e.includes('מע"מ'))}
                helperText={formErrors.find(e => e.includes('מע"מ'))}
                sx={{ minWidth: 120 }}
              />

              <TextField
                label="הנחה"
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  endAdornment: (
                    <FormControl>
                      <Select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'amount' | 'percentage' })}
                        variant="standard"
                        sx={{ minWidth: 50 }}
                      >
                        <MenuItem value="amount">₪</MenuItem>
                        <MenuItem value="percentage">%</MenuItem>
                      </Select>
                    </FormControl>
                  )
                }}
                sx={{ minWidth: 150 }}
              />
            </Box>

            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>סטטוס</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                  label="סטטוס"
                >
                  {state.settings.statuses.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="תאריך יעד"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="הערות"
              placeholder="הערות נוספות על החשבונית..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
            />

            {/* Summary */}
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                סיכום חשבונית:
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">סכום בסיס:</Typography>
                <Typography variant="body2">{formatCurrency(formData.amount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">מע"מ ({formData.vat}%):</Typography>
                <Typography variant="body2">{formatCurrency(formData.amount * (formData.vat / 100))}</Typography>
              </Box>
              {formData.discount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">הנחה:</Typography>
                  <Typography variant="body2" color="success.main">
                    -{formData.discountType === 'percentage' 
                      ? `${formData.discount}%` 
                      : formatCurrency(formData.discount)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">סך לתשלום:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency((() => {
                    const vatAmount = formData.amount * (formData.vat / 100)
                    const grossAmount = formData.amount + vatAmount
                    const discountAmount = formData.discountType === 'percentage' 
                      ? grossAmount * (formData.discount / 100)
                      : formData.discount
                    return grossAmount - discountAmount
                  })())}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.supplierId || !formData.description.trim() || formData.amount <= 0}
          >
            {isEditMode ? 'עדכן' : 'הוסף'}
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

      {/* Add Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          הוסף תשלום לחשבונית
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceForPayment && (
            <Box>
              <Typography variant="body1" gutterBottom>
                הוסף תשלום עבור החשבונית:
              </Typography>
              
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  פרטי החשבונית:
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">תיאור:</Typography>
                  <Typography variant="body2">{selectedInvoiceForPayment.description}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">ספק:</Typography>
                  <Typography variant="body2">{getSupplierDisplayName(selectedInvoiceForPayment.supplierId)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">סכום לתשלום:</Typography>
                  <Typography variant="body2">{formatCurrency(calculateFinalAmount(selectedInvoiceForPayment))}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">נותר לתשלום:</Typography>
                  <Typography variant="body2" color="warning.main">
                    {(() => {
                      const finalAmount = calculateFinalAmount(selectedInvoiceForPayment)
                      const existingPayments = state.payments
                        .filter(p => p.invoiceId === selectedInvoiceForPayment.id)
                        .reduce((sum, p) => sum + p.amount, 0)
                      return formatCurrency(finalAmount - existingPayments)
                    })()}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={2}>
                  <TextField
                    label="סכום תשלום *"
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">₪</InputAdornment>
                    }}
                    sx={{ minWidth: 200 }}
                  />
                  
                  <TextField
                    label="תאריך תשלום *"
                    type="date"
                    value={paymentFormData.date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                </Box>

                <Box display="flex" gap={2}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>אמצעי תשלום *</InputLabel>
                    <Select
                      value={paymentFormData.method}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, method: e.target.value as any })}
                      label="אמצעי תשלום *"
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
                    value={paymentFormData.reference}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                    sx={{ minWidth: 200 }}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="הערות"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  multiline
                  rows={2}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handlePaymentSubmit} 
            variant="contained"
            disabled={paymentFormData.amount <= 0}
          >
            הוסף תשלום
          </Button>
          <Button 
            onClick={() => setPaymentDialogOpen(false)}
          >
            ביטול
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Invoices 