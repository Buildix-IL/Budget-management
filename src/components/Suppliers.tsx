import { useState } from 'react'
import {
  Typography, Box, Button, Card, CardContent,
  TextField, InputAdornment, Fab, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert,
  IconButton, Menu, MenuItem, Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { useData } from '../context/DataContext'
import type { Supplier, SupplierFormData } from '../types'

const Suppliers = () => {
  const { state, addSupplier, updateSupplier, deleteSupplier, validateSupplier } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<SupplierFormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    profession: '',
    phone: '',
    email: '',
    defaultVat: 18
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuSupplierId, setMenuSupplierId] = useState<string | null>(null)

  // Filter suppliers based on search - with safe access
  const filteredSuppliers = state.suppliers.filter(supplier => {
    const firstName = supplier.firstName || '';
    const lastName = supplier.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const companyName = supplier.companyName || '';
    const profession = supplier.profession || '';
    const phone = supplier.phone || '';
    const email = supplier.email || '';
    
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier)
      setFormData({
        firstName: supplier.firstName || '',
        lastName: supplier.lastName || '',
        companyName: supplier.companyName || '',
        profession: supplier.profession || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        defaultVat: supplier.defaultVat || state.settings.defaultVat,
        fields: supplier.fields || {}
      })
      setIsEditMode(true)
    } else {
      setSelectedSupplier(null)
      setFormData({
        firstName: '',
        lastName: '',
        companyName: '',
        profession: '',
        phone: '',
        email: '',
        defaultVat: state.settings.defaultVat
      })
      setIsEditMode(false)
    }
    setFormErrors([])
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedSupplier(null)
    setFormErrors([])
    setAnchorEl(null)
    setMenuSupplierId(null)
  }

  const handleSubmit = () => {
    // Ensure all fields are strings to avoid trim() errors
    const safeFormData = {
      ...formData,
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      companyName: formData.companyName || '',
      profession: formData.profession || '',
      phone: formData.phone || '',
      email: formData.email || ''
    };

    const errors = validateSupplier(safeFormData)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    if (isEditMode && selectedSupplier) {
      updateSupplier(selectedSupplier.id, safeFormData)
    } else {
      addSupplier(safeFormData)
    }
    
    handleCloseDialog()
  }

  const handleDelete = (supplierId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק ספק זה?')) {
      deleteSupplier(supplierId)
      handleCloseDialog()
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, supplierId: string) => {
    setAnchorEl(event.currentTarget)
    setMenuSupplierId(supplierId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuSupplierId(null)
  }

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          🏢 ניהול ספקים
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          הוסף ספק
        </Button>
      </Box>

      {/* Search bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="חיפוש ספקים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Statistics */}
      <Box mb={3}>
        <Chip 
          label={`סך הכל: ${state.suppliers.length} ספקים`}
          variant="outlined"
          sx={{ mr: 1 }}
        />
        {searchTerm && (
          <Chip 
            label={`נמצאו: ${filteredSuppliers.length} תוצאות`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'לא נמצאו ספקים התואמים לחיפוש' : 'עדיין לא הוספת ספקים'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm ? 'נסה לשנות את מונחי החיפוש' : 'התחל בהוספת הספק הראשון שלך'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                הוסף ספק ראשון
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
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} sx={{ height: 'fit-content', position: 'relative' }}>
              <CardContent>
                {/* Menu button */}
                <IconButton
                  sx={{ position: 'absolute', top: 8, left: 8 }}
                  onClick={(e) => handleMenuOpen(e, supplier.id)}
                >
                  <MoreVertIcon />
                </IconButton>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="h6" noWrap>
                    {`${supplier.firstName || ''} ${supplier.lastName || ''}`.trim() || 'ספק ללא שם'}
                  </Typography>
                </Box>

                {(supplier.companyName && supplier.companyName.trim()) && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {supplier.companyName}
                    </Typography>
                  </Box>
                )}
                
                <Chip 
                  label={supplier.profession || 'ללא מקצוע'}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Box display="flex" flexDirection="column" gap={1}>
                  {(supplier.phone && supplier.phone.trim()) && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {supplier.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  {(supplier.email && supplier.email.trim()) && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {supplier.email}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      מע״מ: {supplier.defaultVat || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      נוצר: {formatCreatedDate(supplier.createdAt)}
                    </Typography>
                  </Box>
                </Box>
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
            const supplier = state.suppliers.find(s => s.id === menuSupplierId)
            if (supplier) handleOpenDialog(supplier)
            handleMenuClose()
          }}
        >
          <EditIcon sx={{ ml: 1 }} />
          ערוך
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuSupplierId) handleDelete(menuSupplierId)
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'ערוך ספק' : 'הוסף ספק חדש'}
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
              <TextField
                fullWidth
                label="שם פרטי *"
                placeholder="לדוגמה: יוסי"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={formErrors.some(e => e.includes('שם פרטי'))}
                helperText={formErrors.find(e => e.includes('שם פרטי'))}
              />
              
              <TextField
                fullWidth
                label="שם משפחה *"
                placeholder="לדוגמה: כהן"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={formErrors.some(e => e.includes('שם משפחה'))}
                helperText={formErrors.find(e => e.includes('שם משפחה'))}
              />
            </Box>

            <TextField
              fullWidth
              label="שם חברה (אופציונלי)"
              placeholder="לדוגמה: שיפוצים מעולים בע״מ"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="מקצוע *"
              placeholder="לדוגמה: אלקטריקאי, צבע, חשמלאי"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              error={formErrors.some(e => e.includes('מקצוע'))}
              helperText={formErrors.find(e => e.includes('מקצוע'))}
            />
            
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="טלפון"
                placeholder="050-1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={formErrors.some(e => e.includes('טלפון'))}
                helperText={formErrors.find(e => e.includes('טלפון'))}
              />
              
              <TextField
                fullWidth
                label="אימייל"
                type="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formErrors.some(e => e.includes('אימייל'))}
                helperText={formErrors.find(e => e.includes('אימייל'))}
                className="email-field"
              />
            </Box>
            
            <TextField
              label="מע״מ ברירת מחדל (%)"
              type="number"
              placeholder="18"
              value={formData.defaultVat}
              onChange={(e) => setFormData({ ...formData, defaultVat: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              sx={{ maxWidth: 200 }}
              error={formErrors.some(e => e.includes('מע"מ'))}
              helperText={formErrors.find(e => e.includes('מע"מ')) || 'אחוז המע״מ שיחושב בחשבוניות מספק זה'}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * שדות חובה. נדרש לפחות טלפון או אימייל אחד. כתובת אימייל תאומת אוטומטית.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.firstName.trim() || !formData.lastName.trim() || !formData.profession.trim()}
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
    </Box>
  )
}

export default Suppliers 