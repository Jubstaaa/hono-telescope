import { useLocation, useNavigate } from 'react-router';

import {
  DashboardOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  ExceptionOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Menu, theme } from 'antd';

const menuItems = [
  {
    icon: <DashboardOutlined />,
    key: 'dashboard',
    label: 'Dashboard',
  },
  {
    icon: <DownloadOutlined />,
    key: 'incoming-requests',
    label: 'Incoming Requests',
  },
  {
    icon: <UploadOutlined />,
    key: 'outgoing-requests',
    label: 'Outgoing Requests',
  },
  {
    icon: <DatabaseOutlined />,
    key: 'queries',
    label: 'Queries',
  },
  {
    icon: <ExceptionOutlined />,
    key: 'exceptions',
    label: 'Exceptions',
  },
  {
    icon: <FileTextOutlined />,
    key: 'logs',
    label: 'Logs',
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { token } = theme.useToken();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';

    const segments = path.split('/');
    if (segments[1] === 'entries' && segments[2]) {
      return '';
    }

    return segments[1] || 'dashboard';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${key}`);
    }
  };

  return (
    <Menu
      items={menuItems}
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      style={{ backgroundColor: token.colorBgContainer, border: 'none' }}
      onClick={handleMenuClick}
    />
  );
};
