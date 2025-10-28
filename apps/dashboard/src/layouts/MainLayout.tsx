import React from 'react'
import { Layout, Button, Space, Typography, theme } from 'antd'
import { Outlet } from 'react-router-dom'
import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import { useTheme } from '../contexts/ThemeContext'
import { Sidebar } from '../components/Sidebar'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export const MainLayout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  const { token } = theme.useToken()

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
          <div />
          <Space>
            <Button
              type="text"
              icon={isDark ? <BulbFilled /> : <BulbOutlined />}
              onClick={toggleTheme}
              style={{ color: token.colorText }}
            >
              {isDark ? 'Light' : 'Dark'} Mode
            </Button>
          </Space>
        </Header>
        
        <Content style={{ 
          overflow: 'auto'
        }}>
          <div  style={{padding: '24px'}}>
          <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}