import { useEffect, useState } from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router';

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  GithubOutlined,
  MoonOutlined,
  RadarChartOutlined,
  SunOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Flex,
  Grid,
  Image,
  Layout,
  Popconfirm,
  Space,
  theme,
  Tooltip,
  Typography,
} from 'antd';

import { Sidebar } from '../components/sidebar/sidebar';
import { useTheme } from '../context/theme.context';
import { refreshAllEntries, useClearData } from '../hooks/use-entries';
import TelescopeIcon from '../telescope-icon.svg';

const { Content, Header, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export const MainLayout = () => {
  const { isDark, toggleTheme } = useTheme();
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearData, isLoading: isClearLoading } = useClearData();
  const [liveMode, setLiveMode] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const isDashboard = location.pathname === '/' || location.pathname === '';
  const canGoBack = !isDashboard;

  useEffect(() => {
    if (!liveMode) return;

    const interval = setInterval(() => {
      refreshAllEntries();
    }, 1000);

    return () => clearInterval(interval);
  }, [liveMode]);

  const handleClearData = async () => {
    setClearError(null);

    try {
      await clearData();
      window.location.reload();
    } catch {
      setClearError('Failed to clear data');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        breakpoint="lg"
        collapsed={screens.xs ? true : false}
        trigger={null}
        width={250}
        style={{
          backgroundColor: token.colorBgContainer,
        }}
      >
        <Flex
          align="center"
          gap="8px"
          justify={screens.xs ? 'center' : 'start'}
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            height: '64px',
            padding: '16px',
          }}
        >
          <Image height={32} preview={false} src={TelescopeIcon} width={32} />
          {!screens.xs && (
            <Title level={4} style={{ color: token.colorText, margin: 0 }}>
              Hono Telescope
            </Title>
          )}
        </Flex>
        <Sidebar />
      </Sider>

      <Layout>
        <Header
          style={{
            alignItems: 'center',
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            display: 'flex',
            gap: '12px',
            height: '64px',
            justifyContent: 'space-between',
            padding: screens.xs ? '0 12px' : '0 24px',
          }}
        >
          <Space size="small">
            <Tooltip title="Back">
              <Button
                aria-label="Back"
                disabled={!canGoBack}
                icon={<ArrowLeftOutlined />}
                style={{ color: token.colorText }}
                onClick={() => navigate(-1)}
              />
            </Tooltip>
          </Space>
          <Space size="middle">
            <Popconfirm
              cancelText="Cancel"
              description="Every recorded request, query, log and exception is deleted. This cannot be undone."
              okButtonProps={{ danger: true }}
              okText="Clear everything"
              title="Clear all data?"
              onConfirm={handleClearData}
            >
              <Tooltip title="Clear all data">
                <Button
                  danger
                  aria-label="Clear all data"
                  disabled={isClearLoading}
                  icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
                  loading={isClearLoading}
                />
              </Tooltip>
            </Popconfirm>
            <Tooltip
              title={liveMode ? 'Live mode is on — refreshing every second' : 'Turn on live mode'}
            >
              <Button
                aria-label={liveMode ? 'Turn off live mode' : 'Turn on live mode'}
                icon={
                  <RadarChartOutlined
                    className={liveMode ? 'live-mode-pulse' : ''}
                    style={
                      {
                        '--live-color': liveMode ? token.colorPrimary : token.colorText,
                        color: liveMode ? token.colorPrimary : token.colorText,
                        fontSize: '16px',
                      } as React.CSSProperties & { '--live-color': string }
                    }
                  />
                }
                onClick={() => setLiveMode(!liveMode)}
              />
            </Tooltip>
            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <Button
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                icon={
                  isDark ? (
                    <SunOutlined style={{ fontSize: '16px' }} />
                  ) : (
                    <MoonOutlined style={{ fontSize: '16px' }} />
                  )
                }
                onClick={toggleTheme}
              />
            </Tooltip>
            <Tooltip title="View the project on GitHub">
              <Button
                aria-label="View the project on GitHub"
                href="https://github.com/Jubstaaa/hono-telescope"
                icon={<GithubOutlined style={{ fontSize: '16px' }} />}
                target="_blank"
              />
            </Tooltip>
          </Space>
        </Header>

        <Content
          style={{
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: '100%',
              padding: screens.xs ? '12px' : '24px',
            }}
          >
            {clearError && (
              <Alert
                closable
                showIcon
                message={clearError}
                style={{ marginBottom: '16px' }}
                type="error"
                onClose={() => setClearError(null)}
              />
            )}
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
