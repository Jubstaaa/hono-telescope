import JsonView from '@uiw/react-json-view'
import { theme } from 'antd'

import { useTheme } from '../../theme-context'

export function JsonViewer({ data }: { data: Record<string, unknown> }) {
    const { token } = theme.useToken()
    const { isDark } = useTheme()

    const customTheme = {
        '--w-rjv-arrow-color': token.colorTextSecondary,
        '--w-rjv-background-color': token.colorBgContainer,
        '--w-rjv-brackets-color': token.colorTextTertiary,
        '--w-rjv-colon-color': token.colorTextTertiary,
        '--w-rjv-copied-color': token.colorText,
        '--w-rjv-copied-success-color': token.colorSuccess,
        '--w-rjv-curlybraces-color': token.colorTextTertiary,
        '--w-rjv-font-family': 'monospace',
        '--w-rjv-info-color': token.colorTextQuaternary,
        '--w-rjv-key-number': token.colorText,
        '--w-rjv-key-string': token.colorText,
        '--w-rjv-line-color': token.colorBorderSecondary,
        '--w-rjv-type-boolean-color': token.colorWarningText,
        '--w-rjv-type-null-color': token.colorErrorText,
        '--w-rjv-type-number-color': token.colorPrimaryText,

        '--w-rjv-type-string-color': isDark ? '#73d13d' : '#237804',
    } as React.CSSProperties

    return (
        <JsonView
            collapsed={false}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard
            style={customTheme}
            value={data}>
            <JsonView.String
                render={({ ...props }, { value }) => {
                    return <span {...props}>{String(value)}</span>
                }}
            />
        </JsonView>
    )
}
