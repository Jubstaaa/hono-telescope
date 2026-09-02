import { useEffect, useState } from 'react';
import {
  Layout,
  Button,
  Space,
  Typography,
  theme,
  Flex,
  Image,
  Grid,
  Alert,
  Tooltip,
  Popconfirm,
} from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  RadarChartOutlined,
  SunOutlined,
  MoonOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { Sidebar } from '../components/Sidebar';
import TelescopeIcon from '../telescope-icon.svg';
import { useClearData, refreshAllEntries } from '../hooks/use-entries';

const { Header, Sider, Content } = Layout;
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
        width={250}
        collapsible
        collapsed={screens.xs ? true : false}
        breakpoint="lg"
        trigger={null}
        style={{
          backgroundColor: token.colorBgContainer,
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
            <Tooltip title="Back">
              <Button
                aria-label="Back"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                disabled={!canGoBack}
                style={{ color: token.colorText }}
              />
            </Tooltip>
          </Space>
          <Space size="middle">
            <Popconfirm
              title="Clear all data?"
              description="Every recorded request, query, log and exception is deleted. This cannot be undone."
              okText="Clear everything"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={handleClearData}
            >
              <Tooltip title="Clear all data">
                <Button
                  danger
                  aria-label="Clear all data"
                  icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
                  loading={isClearLoading}
                  disabled={isClearLoading}
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
                        fontSize: '16px',
                        color: liveMode ? token.colorPrimary : token.colorText,
                        '--live-color': liveMode ? token.colorPrimary : token.colorText,
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
                icon={<GithubOutlined style={{ fontSize: '16px' }} />}
                href="https://github.com/Jubstaaa/hono-telescope"
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
              padding: screens.xs ? '12px' : '24px',
              height: '100%',
            }}
          >
            {clearError && (
              <Alert
                type="error"
                message={clearError}
                closable
                showIcon
                onClose={() => setClearError(null)}
                style={{ marginBottom: '16px' }}
              />
            )}
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
