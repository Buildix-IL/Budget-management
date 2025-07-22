import { useState, useEffect } from 'react'
import {
  Typography, Box, Card, CardContent, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Download as ExportIcon,
  Upload as ImportIcon
} from '@mui/icons-material'
import { useData } from '../context/DataContext'
import type { Settings as SettingsType, InvoiceStatus } from '../types'

const Settings = () => {
  const { state, exportData, importData, updateSettings } = useData()
  const [settings, setSettings] = useState<SettingsType>(state.settings)
  const [newStatus, setNewStatus] = useState('')
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editStatusValue, setEditStatusValue] = useState('')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setSettings(state.settings)
  }, [state.settings])

  const handleSaveSettings = () => {
    const validation = validateSettings(settings)
    if (validation.length > 0) {
      setErrors(validation)
      return
    }

    updateSettings(settings)
    setSaveMessage('הגדרות נשמרו בהצלחה!')
    setErrors([])
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const validateSettings = (data: SettingsType): string[] => {
    const errors: string[] = []
    if (data.defaultVat < 0 || data.defaultVat > 100) {
      errors.push('אחוז המע"מ חייב להיות בין 0 ל-100')
    }
    if (data.statuses.length === 0) {
      errors.push('חייב להיות לפחות סטטוס אחד')
    }
    return errors
  }

  const handleAddStatus = () => {
    if (newStatus.trim() && !settings.statuses.includes(newStatus.trim() as InvoiceStatus)) {
      setSettings({
        ...settings,
        statuses: [...settings.statuses, newStatus.trim() as InvoiceStatus]
      })
      setNewStatus('')
      setIsStatusDialogOpen(false)
    }
  }

  const handleEditStatus = (oldStatus: InvoiceStatus, newStatusText: string) => {
    if (newStatusText.trim() && !settings.statuses.includes(newStatusText.trim() as InvoiceStatus)) {
      setSettings({
        ...settings,
        statuses: settings.statuses.map(s => s === oldStatus ? newStatusText.trim() as InvoiceStatus : s)
      })
      setEditingStatus(null)
      setEditStatusValue('')
    }
  }

  const handleDeleteStatus = (status: InvoiceStatus) => {
    if (settings.statuses.length > 1) {
      setSettings({
        ...settings,
        statuses: settings.statuses.filter(s => s !== status)
      })
    }
  }

  const handleExportData = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setSaveMessage('נתונים יוצאו בהצלחה!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleImportData = () => {
    try {
      const success = importData(importText)
      if (success) {
        setSaveMessage('נתונים יובאו בהצלחה!')
        setImportDialogOpen(false)
        setImportText('')
        setErrors([])
      } else {
        setErrors(['שגיאה בייבוא הנתונים - פורמט לא תקין'])
      }
    } catch (error) {
      setErrors(['שגיאה בייבוא הנתונים - פורמט לא תקין'])
    }
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const formatDataSize = () => {
    const dataStr = exportData()
    const bytes = new Blob([dataStr]).size
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          ⚙️ הגדרות
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          size="large"
        >
          שמור הגדרות
        </Button>
      </Box>

      {saveMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {saveMessage}
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <ul style={{ margin: 0, paddingRight: 20 }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Box display="flex" flexDirection="column" gap={3}>
        {/* General Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              הגדרות כלליות
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="מע״מ ברירת מחדל (%)"
                type="number"
                value={settings.defaultVat}
                onChange={(e) => setSettings({
                  ...settings,
                  defaultVat: parseFloat(e.target.value) || 0
                })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                sx={{ maxWidth: 200 }}
                helperText="אחוז המע״מ שיחושב בחשבוניות חדשות"
              />

              <TextField
                label="מטבע"
                value={settings.currency}
                onChange={(e) => setSettings({
                  ...settings,
                  currency: e.target.value
                })}
                sx={{ maxWidth: 150 }}
                disabled
                helperText="כרגע נתמך רק שקל ישראלי"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Invoice Statuses */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                סטטוסי חשבוניות
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setIsStatusDialogOpen(true)}
                size="small"
              >
                הוסף סטטוס
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              נהל את סטטוסי החשבוניות הזמינים במערכת
            </Typography>

            <List>
              {settings.statuses.map((status, index) => (
                <ListItem key={status} divider={index < settings.statuses.length - 1}>
                  {editingStatus === status ? (
                    <Box display="flex" gap={1} width="100%">
                      <TextField
                        size="small"
                        value={editStatusValue}
                        onChange={(e) => setEditStatusValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditStatus(status as InvoiceStatus, editStatusValue)
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="small"
                        onClick={() => handleEditStatus(status as InvoiceStatus, editStatusValue)}
                      >
                        שמור
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingStatus(null)
                          setEditStatusValue('')
                        }}
                      >
                        ביטול
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <ListItemText primary={status} />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingStatus(status)
                            setEditStatusValue(status)
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStatus(status as InvoiceStatus)}
                          disabled={settings.statuses.length <= 1}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </>
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ניהול נתונים
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ייצוא וייבוא נתונים לגיבוי ושחזור
            </Typography>

            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Box display="flex" gap={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={handleExportData}
                >
                  ייצא נתונים
                </Button>
                <Typography variant="body2" color="text.secondary">
                  גודל נתונים: {formatDataSize()}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<ImportIcon />}
                onClick={() => setImportDialogOpen(true)}
                color="warning"
              >
                ייבא נתונים
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              מידע מערכת
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">סך ספקים:</Typography>
                <Typography variant="body2">{state.suppliers.length}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">סך הצעות מחיר:</Typography>
                <Typography variant="body2">{state.quotes.length}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">סך חשבוניות:</Typography>
                <Typography variant="body2">{state.invoices.length}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">סך תשלומים:</Typography>
                <Typography variant="body2">{state.payments.length}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">גרסת מערכת:</Typography>
                <Typography variant="body2">1.0.0</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">אחסון נתונים:</Typography>
                <Typography variant="body2">LocalStorage</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Add Status Dialog */}
      <Dialog open={isStatusDialogOpen} onClose={() => setIsStatusDialogOpen(false)}>
        <DialogTitle>הוסף סטטוס חדש</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="שם הסטטוס"
            fullWidth
            variant="outlined"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddStatus()
              }
            }}
            placeholder="לדוגמה: בהמתנה לאישור"
            helperText="שם הסטטוס כפי שיופיע ברשימת הסטטוסים"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddStatus} variant="contained">
            הוסף
          </Button>
          <Button onClick={() => setIsStatusDialogOpen(false)}>
            ביטול
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ייבא נתונים
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>אזהרה:</strong> ייבוא נתונים ימחוק את כל הנתונים הקיימים במערכת!
              וודא שיש לך גיבוי לפני הביצוע.
            </Typography>
          </Alert>
          
          <TextField
            margin="dense"
            label="נתוני JSON"
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="הדבק כאן את קובץ ה-JSON שיוצא מהמערכת..."
            helperText="הדבק את תוכן קובץ הגיבוי ב-JSON שיוצא מהמערכת"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleImportData} 
            variant="contained"
            color="warning"
            disabled={!importText.trim()}
          >
            ייבא נתונים
          </Button>
          <Button onClick={() => setImportDialogOpen(false)}>
            ביטול
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Settings 