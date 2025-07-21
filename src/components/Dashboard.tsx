import { Typography, Card, CardContent, Box } from '@mui/material'

const Dashboard = () => {
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
              <Typography variant="h5" component="div">
                ₪0
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
              <Typography variant="h5" component="div">
                ₪0
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
              <Typography variant="h5" component="div">
                ₪0
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
              <Typography variant="h5" component="div">
                0
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
          <Typography variant="body2">
            טוען...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard 