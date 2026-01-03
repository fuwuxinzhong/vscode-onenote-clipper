# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of OneNote Clipper for VSCode
- Support for sending selected code snippets to OneNote
- Support for sending entire files to OneNote
- OAuth2 authentication with Microsoft accounts
- Support for both personal and organizational accounts
- Interactive welcome guide for first-time users
- Configuration validation and error handling
- Keyboard shortcuts support
- Context menu integration
- Security check script for development

### Security
- No hardcoded credentials in source code
- Credentials managed through VSCode settings
- Each user creates their own Azure application
- End-to-end encryption for data transmission
- Minimal permission requests

### Documentation
- Comprehensive user guide
- Security configuration guide
- Azure application setup instructions
- Release checklist

## [0.0.1] - 2026-01-01

### Added
- Initial project structure
- Basic OneNote integration
- OAuth2 authentication flow
- Code snippet sending functionality
- File sending functionality
- Target selection (notebook/section)
- Configuration system

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

## Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities