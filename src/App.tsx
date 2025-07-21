import { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Container, AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { DataProvider } from './context/DataContext'
import Dashboard from './components/Dashboard'
import Suppliers from './components/Suppliers'
import Quotes from './components/Quotes'
import Invoices from './components/Invoices'
import Payments from './components/Payments'
import Settings from './components/Settings'

// יצירת cache עבור RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

// יצירת theme עם תמיכה ב-RTL ועברית
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
  },
  palette: {
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#2c3e50',
    },
    background: {
      default: '#f5f6fa',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: 'rtl',
          fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        },
        '*': {
          direction: 'rtl',
        },
        'html': {
          direction: 'rtl',
        },
      },
    },
  },
})

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      dir="rtl"
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function App() {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box dir="rtl" sx={{ minHeight: '100vh' }}>
          <DataProvider>
            <AppBar position="static" elevation={2}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  🏗️ ניהול תקציב פרויקט בניה
                </Typography>
              </Toolbar>
            </AppBar>
            
            <Container maxWidth="xl" sx={{ mt: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={currentTab} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="📊 סקירה" />
                  <Tab label="🏢 ספקים" />
                  <Tab label="💼 הצעות מחיר" />
                  <Tab label="📄 חשבוניות" />
                  <Tab label="💰 תשלומים" />
                  <Tab label="⚙️ הגדרות" />
                </Tabs>
              </Box>

              <TabPanel value={currentTab} index={0}>
                <Dashboard />
              </TabPanel>
              <TabPanel value={currentTab} index={1}>
                <Suppliers />
              </TabPanel>
              <TabPanel value={currentTab} index={2}>
                <Quotes />
              </TabPanel>
              <TabPanel value={currentTab} index={3}>
                <Invoices />
              </TabPanel>
              <TabPanel value={currentTab} index={4}>
                <Payments />
              </TabPanel>
              <TabPanel value={currentTab} index={5}>
                <Settings />
              </TabPanel>
            </Container>
          </DataProvider>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  )
}

export default App 