import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  features: {
    typescript: true, // support TS
    stylistic: false, // disable formatting rules (use Prettier separately)
  },
}).append({
  rules: {
    // Disable Vue HTML self-closing warnings
    "vue/html-self-closing": "off",

    // // Disable Vue attributes order warnings
    // "vue/attributes-order": "off",

    // // Disable TypeScript unused vars warnings (allow unused variables)
    // "@typescript-eslint/no-unused-vars": "off",

    // // Disable TypeScript explicit any warnings (allow 'any' type)
    // "@typescript-eslint/no-explicit-any": "off",
  },
});
