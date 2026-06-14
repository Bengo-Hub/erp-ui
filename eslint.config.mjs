import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: ["legacy-vue/**", ".next/**", "node_modules/**", "public/**", "dist/**"] },
  ...coreWebVitals,
];

export default eslintConfig;
