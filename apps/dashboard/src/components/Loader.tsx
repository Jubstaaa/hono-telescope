import { Flex, Spin } from 'antd';

function Loader() {
  return (
    <Flex justify="center" align="center" style={{ height: '100%' }}>
      <Spin size="large" />
    </Flex>
  );
}

export default Loader;
