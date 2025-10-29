import React from 'react'
import { Layout, Button, Space, Typography, theme, Switch, } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {  ArrowLeftOutlined } from '@ant-design/icons'
import { useTheme } from '../contexts/ThemeContext'
import { Sidebar } from '../components/Sidebar'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export const MainLayout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/'
  const canGoBack = !isDashboard

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={ {backgroundColor: token.colorBgContainer} } >
        <div style={{ 
          height: '64px',
          padding: '16px', 
          borderBottom: `1px solid ${token.colorBorder}`,
          backgroundColor: token.colorBgContainer
        }}>
          <Title level={4} style={{ margin: 0, color: token.colorText }}>
            Hono Telescope
          </Title>
        </div>
        <Sidebar />
      </Sider>
      
      <Layout>
        <Header style={{ 
          height: '64px',
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${token.colorBorder}`,
          backgroundColor: token.colorBgContainer
        }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            disabled={!canGoBack}
            style={{ color: token.colorText }}
          />
          <Space>
            <Switch
          checked={isDark}  
          onChange={toggleTheme}
          checkedChildren="🌙"
          unCheckedChildren="☀️"
        />
          </Space>
        </Header>
        
        <Content style={{ 
          overflow: 'auto',
        }}>
          <div style={{ padding: '24px', height: '100%' }}>

          <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}