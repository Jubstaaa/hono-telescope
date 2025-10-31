import React from 'react';
import { Layout, Button, Space, Typography, theme, Switch, Flex, Image, Grid } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { Sidebar } from '../components/Sidebar';
import TelescopeIcon from '../telescope-icon.svg';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export const MainLayout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const canGoBack = !isDashboard;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        collapsible
        collapsed={screens.xs ? true : false}
        breakpoint="lg"
        trigger={null}
        style={{
          backgroundColor: token.colorBgContainer,
          position: 'relative',
          height: '100vh',
          left: 0,
          top: 0,
        }}
      >
        <Flex
          justify={screens.xs ? 'center' : 'start'}
          align="center"
          gap="8px"
          style={{
            height: '64px',
            padding: '16px',
            borderBottom: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorBgContainer,
          }}
        >
          <Image src={TelescopeIcon} width={32} height={32} preview={false} />
          {!screens.xs && (
            <Title level={4} style={{ margin: 0, color: token.colorText }}>
              Hono Telescope
            </Title>
          )}
        </Flex>
        <Sidebar />
      </Sider>

      <Layout>
        <Header
          style={{
            height: '64px',
            padding: screens.xs ? '0 12px' : '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorBgContainer,
            gap: '12px',
          }}
        >
          <Space size="small">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              disabled={!canGoBack}
              style={{ color: token.colorText }}
            />
          </Space>
          <Space>
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
          </Space>
        </Header>

        <Content
          style={{
            overflow: 'auto',
          }}
        >
          <div
            style={{
              padding: screens.xs ? '12px' : '24px',
              height: '100%',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
