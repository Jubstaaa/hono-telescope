import React from 'react'
import { Menu, theme } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  ExceptionOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons'

const menuItems = [
  { 
    key: 'dashboard', 
    label: 'Dashboard', 
    icon: <DashboardOutlined />
  },
  { 
    key: 'incoming-requests', 
    label: 'Incoming Requests', 
    icon: <DownloadOutlined />
  },
  { 
    key: 'outgoing-requests', 
    label: 'Outgoing Requests', 
    icon: <UploadOutlined />
  },
  { 
    key: 'queries', 
    label: 'Queries', 
    icon: <DatabaseOutlined />
  },
  { 
    key: 'exceptions', 
    label: 'Exceptions', 
    icon: <ExceptionOutlined />
  },
  { 
    key: 'logs', 
    label: 'Logs', 
    icon: <FileTextOutlined />
  }
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { token } = theme.useToken()

  const getSelectedKey = () => {
    const path = location.pathname
    if (path === '/' || path === '/dashboard') return 'dashboard'
    
    const segments = path.split('/')
    if (segments[1] === 'entries' && segments[2]) {
      // For entry detail pages, don't highlight any menu item
      return ''
    }
    
    return segments[1] || 'dashboard'
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'dashboard') {
      navigate('/')
    } else {
      navigate(`/${key}`)
    }
  }

  return (
    <Menu
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ border: 'none' ,backgroundColor: token.colorBgContainer }}
    />
  )
}