import JsonView from '@uiw/react-json-view';
import { theme } from 'antd';

export function JsonViewer({ data }: { data: Record<string, unknown> }) {
  const { token } = theme.useToken();

  const customTheme = {
    '--w-rjv-font-family': 'monospace',
    '--w-rjv-background-color': token.colorBgContainer,
    '--w-rjv-line-color': token.colorBorderSecondary,
    '--w-rjv-arrow-color': token.colorTextSecondary,
    '--w-rjv-key-string': token.colorText,
    '--w-rjv-key-number': token.colorText,
    '--w-rjv-curlybraces-color': token.colorTextTertiary,
    '--w-rjv-colon-color': token.colorTextTertiary,
    '--w-rjv-brackets-color': token.colorTextTertiary,
    '--w-rjv-info-color': token.colorTextQuaternary,
    '--w-rjv-copied-color': token.colorText,
    '--w-rjv-copied-success-color': token.colorSuccess,
    '--w-rjv-type-string-color': token.colorInfoText,
    '--w-rjv-type-boolean-color': token.colorWarningText,
    '--w-rjv-type-number-color': token.colorPrimaryText,
    '--w-rjv-type-null-color': token.colorErrorText,
  } as React.CSSProperties;

  return (
    <JsonView
      value={data}
      style={customTheme}
      collapsed={false}
      displayDataTypes={false}
      enableClipboard
      displayObjectSize={false}
    >
      <JsonView.String
        render={({ ...props }, { value }) => {
          return <span {...props}>{String(value)}</span>;
        }}
      />
    </JsonView>
  );
}
