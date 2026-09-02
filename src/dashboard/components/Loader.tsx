import { Flex, Spin } from 'antd';

function Loader() {
  return (
    <Flex align="center" justify="center" style={{ height: '100%' }}>
      <Spin size="large" />
    </Flex>
  );
}

export default Loader;
