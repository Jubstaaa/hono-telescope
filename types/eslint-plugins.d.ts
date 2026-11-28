declare module 'eslint-plugin-jsx-a11y' {
    import type { Linter } from 'eslint'

    const plugin: {
        flatConfigs: { recommended: Linter.Config; strict: Linter.Config }
    }
    export default plugin
}
