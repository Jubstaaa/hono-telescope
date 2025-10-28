import React from 'react'
import { Spin, theme } from 'antd'

export const LoadingSpinner: React.FC = () => {
  const { token } = theme.useToken()
  
  return (
    <div className="flex items-center justify-center p-8">
      <Spin size="large" />
      <span style={{ marginLeft: '12px', color: token.colorTextSecondary }}>Loading...</span>
    </div>
  )
}