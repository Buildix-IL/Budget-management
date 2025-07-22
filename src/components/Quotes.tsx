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
  RequestQuote as QuoteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as AcceptedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Receipt as CreateInvoiceIcon
} from '@mui/icons-material'
import { useData } from '../context/DataContext'
import type { Quote, QuoteFormData } from '../types'

const Quotes = () => {
  const { state, addQuote, updateQuote, deleteQuote, validateQuote, addInvoice, getSupplierById } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<QuoteFormData>({
    supplierId: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'pending'
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuQuoteId, setMenuQuoteId] = useState<string | null>(null)
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false)
  const [selectedQuoteForInvoice, setSelectedQuoteForInvoice] = useState<Quote | null>(null)

  // Filter quotes based on search and status
  const filteredQuotes = state.quotes.filter(quote => {
    const supplier = state.suppliers.find(s => s.id === quote.supplierId)
    const supplierName = supplier ? `${supplier.firstName} ${supplier.lastName} ${supplier.companyName || ''}`.trim() : ''
    
    const matchesSearch = (
      quote.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.notes && quote.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleOpenDialog = (quote?: Quote) => {
    if (quote) {
      setSelectedQuote(quote)
      setFormData({
        supplierId: quote.supplierId,
        description: quote.description,
        amount: quote.amount,
        date: quote.date || new Date().toISOString().split('T')[0],
        notes: quote.notes || '',
        status: quote.status
      })
      setIsEditMode(true)
    } else {
      setSelectedQuote(null)
      setFormData({
        supplierId: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pending'
      })
      setIsEditMode(false)
    }
    setFormErrors([])
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedQuote(null)
    setFormErrors([])
    setAnchorEl(null)
    setMenuQuoteId(null)
  }

  const handleSubmit = () => {
    const errors = validateQuote(formData)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    if (isEditMode && selectedQuote) {
      updateQuote(selectedQuote.id, formData)
    } else {
      addQuote(formData)
    }
    
    handleCloseDialog()
  }

  const handleDelete = (quoteId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק הצעת מחיר זו?')) {
      deleteQuote(quoteId)
      handleCloseDialog()
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quoteId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuQuoteId(quoteId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuQuoteId(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <AcceptedIcon color="success" />
      case 'rejected': return <RejectedIcon color="error" />
      default: return <PendingIcon color="warning" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'התקבל'
      case 'rejected': return 'נדחה'
      default: return 'ממתין לאישור'
    }
  }

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'accepted': return 'success'
      case 'rejected': return 'error'
      default: return 'warning'
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
    const supplier = state.suppliers.find(s => s.id === supplierId)
    if (!supplier) return 'ספק לא ידוע'
    
    const fullName = `${supplier.firstName} ${supplier.lastName}`.trim()
    return supplier.companyName ? `${fullName} (${supplier.companyName})` : fullName
  }

  const handleCreateInvoice = (quote: Quote) => {
    setSelectedQuoteForInvoice(quote)
    setCreateInvoiceDialogOpen(true)
  }

  const handleCreateInvoiceSubmit = () => {
    if (!selectedQuoteForInvoice) return

    const supplier = getSupplierById(selectedQuoteForInvoice.supplierId)
    
    const invoiceData = {
      supplierId: selectedQuoteForInvoice.supplierId,
      quoteId: selectedQuoteForInvoice.id,
      description: selectedQuoteForInvoice.description,
      amount: selectedQuoteForInvoice.amount,
      vat: supplier?.defaultVat || state.settings.defaultVat,
      discount: 0,
      discountType: 'amount' as const,
      status: 'ממתין לתשלום' as const,
      dueDate: '',
      paymentBreakdown: [],
      notes: selectedQuoteForInvoice.notes || ''
    }

    addInvoice(invoiceData)
    setCreateInvoiceDialogOpen(false)
    setSelectedQuoteForInvoice(null)
    handleMenuClose()
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          💼 הצעות מחיר
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          הוסף הצעת מחיר
        </Button>
      </Box>

      {/* Search and Filter bar */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <TextField
          placeholder="חיפוש הצעות מחיר..."
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
            <MenuItem value="pending">ממתין לאישור</MenuItem>
            <MenuItem value="accepted">התקבל</MenuItem>
            <MenuItem value="rejected">נדחה</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Statistics */}
      <Box mb={3}>
        <Chip 
          label={`סך הכל: ${state.quotes.length} הצעות מחיר`}
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`ממתינות: ${state.quotes.filter(q => q.status === 'pending').length}`}
          color="warning"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`התקבלו: ${state.quotes.filter(q => q.status === 'accepted').length}`}
          color="success"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Chip 
          label={`נדחו: ${state.quotes.filter(q => q.status === 'rejected').length}`}
          color="error"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        {searchTerm && (
          <Chip 
            label={`נמצאו: ${filteredQuotes.length} תוצאות`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <QuoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו הצעות מחיר התואמות לסינון' : 'עדיין לא הוספת הצעות מחיר'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm || statusFilter !== 'all' ? 'נסה לשנות את הסינון או החיפוש' : 'התחל בהוספת הצעת המחיר הראשונה שלך'}
            </Typography>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                הוסף הצעת מחיר ראשונה
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box 
          display="grid" 
          gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" 
          gap={3}
        >
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} sx={{ height: 'fit-content', position: 'relative' }}>
              <CardContent>
                {/* Menu button */}
                <IconButton
                  sx={{ position: 'absolute', top: 8, left: 8 }}
                  onClick={(e) => handleMenuOpen(e, quote.id)}
                >
                  <MoreVertIcon />
                </IconButton>

                {/* Status chip */}
                <Box display="flex" justifyContent="flex-end" mb={1}>
                  <Chip
                    icon={getStatusIcon(quote.status)}
                    label={getStatusText(quote.status)}
                    color={getStatusColor(quote.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="h6" gutterBottom noWrap>
                  {quote.description}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {getSupplierDisplayName(quote.supplierId)}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(quote.amount)}
                  </Typography>
                  {quote.date && (
                    <Typography variant="caption" color="text.secondary">
                      {formatCreatedDate(quote.date)}
                    </Typography>
                  )}
                </Box>

                {quote.notes && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {quote.notes}
                    </Typography>
                  </>
                )}

                <Divider sx={{ my: 1 }} />
                
                <Typography variant="caption" color="text.secondary">
                  נוצר: {formatCreatedDate(quote.createdAt)}
                </Typography>
              </CardContent>
            </Card>
          ))}
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
            const quote = state.quotes.find(q => q.id === menuQuoteId)
            if (quote) handleOpenDialog(quote)
            handleMenuClose()
          }}
        >
          <EditIcon sx={{ ml: 1 }} />
          ערוך
        </MenuItem>
        {menuQuoteId && state.quotes.find(q => q.id === menuQuoteId)?.status === 'accepted' && (
          <MenuItem 
            onClick={() => {
              const quote = state.quotes.find(q => q.id === menuQuoteId)
              if (quote) handleCreateInvoice(quote)
            }}
          >
            <CreateInvoiceIcon sx={{ ml: 1 }} />
            צור חשבונית
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => {
            if (menuQuoteId) handleDelete(menuQuoteId)
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
          {isEditMode ? 'ערוך הצעת מחיר' : 'הוסף הצעת מחיר חדשה'}
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
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
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
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>סטטוס</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'accepted' | 'rejected' })}
                  label="סטטוס"
                >
                  <MenuItem value="pending">ממתין לאישור</MenuItem>
                  <MenuItem value="accepted">התקבל</MenuItem>
                  <MenuItem value="rejected">נדחה</MenuItem>
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
                label="סכום הצעה *"
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
                label="תאריך הצעה"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="הערות"
              placeholder="הערות נוספות על ההצעה..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
            />
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

      {/* Create Invoice Confirmation Dialog */}
      <Dialog 
        open={createInvoiceDialogOpen} 
        onClose={() => setCreateInvoiceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          צור חשבונית מהצעת מחיר
        </DialogTitle>
        <DialogContent>
          {selectedQuoteForInvoice && (
            <Box>
              <Typography variant="body1" gutterBottom>
                האם אתה בטוח שברצונך ליצור חשבונית מהצעת המחיר הבאה?
              </Typography>
              
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  פרטי הצעת המחיר:
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">תיאור:</Typography>
                  <Typography variant="body2">{selectedQuoteForInvoice.description}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">ספק:</Typography>
                  <Typography variant="body2">{getSupplierDisplayName(selectedQuoteForInvoice.supplierId)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">סכום:</Typography>
                  <Typography variant="body2">{formatCurrency(selectedQuoteForInvoice.amount)}</Typography>
                </Box>
                {selectedQuoteForInvoice.notes && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">הערות:</Typography>
                    <Typography variant="body2">{selectedQuoteForInvoice.notes}</Typography>
                  </Box>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                החשבונית תיווצר עם הנתונים מהצעת המחיר. תוכל לערוך אותה לאחר מכן במסך החשבוניות.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCreateInvoiceSubmit} 
            variant="contained"
            color="primary"
          >
            צור חשבונית
          </Button>
          <Button 
            onClick={() => setCreateInvoiceDialogOpen(false)}
          >
            ביטול
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Quotes 