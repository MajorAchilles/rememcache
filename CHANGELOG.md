# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-17

- Initial release
  - Provider layer (MemProvider, RedisProvider) with per-prefix logical partitioning
  - Configurable underlying cache clients and configuration helpers
  - Rate limiting provider with configurable window and max requests
  - Demo runners for the providers and the rate limiter
  - Unit tests and CI workflow (Vitest + GitHub Actions)
  - README with usage examples
