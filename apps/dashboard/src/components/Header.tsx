import { Layout, Typography, Button, Space, Badge, message } from 'antd'
import { ReloadOutlined, ClearOutlined } from '@ant-design/icons'

const { Header: AntHeader } = Layout
const { Text } = Typography

export function Header() {
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleClear = async () => {
    try {
      const response = await fetch('/telescope/api/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        message.success('All entries cleared successfully')
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        message.error('Failed to clear entries')
      }
    } catch (error) {
      message.error('Error clearing entries')
      console.error('Clear error:', error)
    }
  }

  return (
    <AntHeader 
      style={{ 
        background: '#1f2937',
        borderBottom: '1px solid #374151',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}
    >
      <div>
        <Text style={{ color: '#d1d5db', fontSize: '16px' }}>
        Hono Telescope
      </Text>
        <Badge 
          count="Live" 
          style={{ 
            backgroundColor: '#10b981',
            marginLeft: '12px'
          }} 
        />
      </div>
      
      <Space>
        <Button 
          type="text" 
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          style={{ color: '#d1d5db' }}
        >
          Refresh
        </Button>
        <Button 
          type="text" 
          icon={<ClearOutlined />}
          onClick={handleClear}
          style={{ color: '#d1d5db' }}
        >
          Clear
        </Button>
      </Space>
    </AntHeader>
  )
}