// commitlint.config.ts
import type { UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  // - feat: A new feature
  // - fix: A bug fix
  // - docs: Documentation only changes
  // - style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
  // - refactor: A code change that neither fixes a bug nor adds a feature
  // - perf: A code change that improves performance
  // - test: Adding missing tests or correcting existing tests
  // - build: Changes that affect the build system or external dependencies
  // - ci: Changes to our CI configuration files and scripts
  // - chore: Other changes that don't modify src or test files
  // - revert: Reverts a previous commit

  // Custom Rules
  rules: {
    // Ensure the scope is always lowercase (e.g., feat(api))
    'scope-case': [2, 'always', 'lower-case'],
  },
};

export default Configuration;
