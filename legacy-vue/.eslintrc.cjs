/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-prettier'],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        'vue/multi-word-component-names': 'off',
        'vue/no-reserved-component-names': 'off',
        'vue/component-tags-order': [
            'error',
            {
                order: ['script', 'template', 'style']
            }
        ]
    },
    overrides: [
        {
            files: ['src/components/**/*.vue', 'src/components/**/*.js', 'src/components/**/*.jsx', 'src/views/**/*.vue', 'src/views/**/*.js', 'src/views/**/*.jsx'],
            rules: {
                // Enforce: components and views must not import axios directly
                'no-restricted-imports': [
                    'error',
                    {
                        paths: ['axios']
                    }
                ]
            }
        }
    ]
};
