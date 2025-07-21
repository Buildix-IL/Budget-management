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
  MoreVert as MoreVertIcon
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
    name: '',
    profession: '',
    phone: '',
    email: '',
    defaultVat: 18
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuSupplierId, setMenuSupplierId] = useState<string | null>(null)

  // Filter suppliers based on search
  const filteredSuppliers = state.suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier)
      setFormData({
        name: supplier.name,
        profession: supplier.profession,
        phone: supplier.phone,
        email: supplier.email,
        defaultVat: supplier.defaultVat,
        fields: supplier.fields
      })
      setIsEditMode(true)
    } else {
      setSelectedSupplier(null)
      setFormData({
        name: '',
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
    const errors = validateSupplier(formData)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    if (isEditMode && selectedSupplier) {
      updateSupplier(selectedSupplier.id, formData)
    } else {
      addSupplier(formData)
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
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={(e) => handleMenuOpen(e, supplier.id)}
                >
                  <MoreVertIcon />
                </IconButton>

                <Typography variant="h6" gutterBottom noWrap>
                  {supplier.name}
                </Typography>
                
                <Chip 
                  label={supplier.profession}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Box display="flex" flexDirection="column" gap={1}>
                  {supplier.phone && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {supplier.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  {supplier.email && (
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
                      מע"מ: {supplier.defaultVat}%
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
          <EditIcon sx={{ mr: 1 }} />
          ערוך
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuSupplierId) handleDelete(menuSupplierId)
            handleMenuClose()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
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
            <TextField
              fullWidth
              label="שם הספק *"
              placeholder="לדוגמה: חברת שיפוצים מעולים"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.some(e => e.includes('שם'))}
              helperText={formErrors.find(e => e.includes('שם'))}
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
              helperText={formErrors.find(e => e.includes('מע"מ')) || 'אחוז המע"מ שיחושב בחשבוניות מספק זה'}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * שדות חובה. נדרש לפחות טלפון או אימייל אחד. כתובת אימייל תאומת אוטומטית.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            ביטול
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name.trim() || !formData.profession.trim()}
          >
            {isEditMode ? 'עדכן' : 'הוסף'}
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
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

export default Suppliers 