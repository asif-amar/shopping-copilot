# Chrome Extension Release Checklist

## Pre-Build Validation

### Code Quality
- [ ] All TypeScript compilation errors resolved
- [ ] ESLint passes without errors: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] No console.log statements in production code paths
- [ ] All TODO/FIXME comments addressed or documented

### Security Review
- [ ] No hardcoded secrets, API keys, or credentials in source code
- [ ] All external API calls use HTTPS
- [ ] Input validation implemented for all user-facing inputs
- [ ] XSS prevention measures in place for dynamic content

## Build Process

### Environment Setup
- [ ] Production OAuth client ID configured
- [ ] Production backend endpoints verified
- [ ] Extension redirect URI allow-listed in OAuth provider console: `https://<EXTENSION_ID>.chromiumapp.org/*`

### Build Commands
- [ ] Clean build: `npm run clean && npm run build:prod`
- [ ] Manifest validation passes: `node scripts/ci-validate.mjs dist/manifest.json`
- [ ] No build warnings or errors
- [ ] Extension archive created: `npm run zip:prod`

## Automated Checks (scripts/ci-validate.mjs)

### Security Validation
- [ ] ✅ No localhost references anywhere in `dist/manifest.json`
- [ ] ✅ No unsafe-inline or unsafe-eval in CSP
- [ ] ✅ All host permissions use HTTPS
- [ ] ✅ No development-only permissions in production build

### Build Quality
- [ ] ✅ Background service worker loads without errors
- [ ] ✅ Version properly bumped from previous release
- [ ] ✅ Archive size under Chrome Web Store 128MB limit
- [ ] ✅ Required icon sizes present (16, 32, 48, 128px)
- [ ] ✅ Valid semantic version format (X.Y.Z)

### File Structure
- [ ] ✅ dist/manifest.json exists and is valid JSON
- [ ] ✅ All referenced files exist in build output
- [ ] ✅ No source maps in production build (unless intentional)
- [ ] ✅ No development dependencies in final package

## Manual Testing

### Extension Loading
- [ ] Extension loads in Chrome without errors
- [ ] Service worker starts and runs without console errors
- [ ] Side panel opens correctly
- [ ] Options page accessible and functional

### Core Functionality
- [ ] User authentication flow works end-to-end
- [ ] Shopping site detection functions properly
- [ ] Permission requests display appropriate messaging
- [ ] Backend API communication successful
- [ ] Error handling graceful for network issues

### Shopping Site Integration
- [ ] Rami Levy integration functional (if permissions granted)
- [ ] Shufersal integration functional (if permissions granted)
- [ ] Graceful handling when site permissions denied
- [ ] Shopping cart operations work correctly

### Cross-Browser Testing
- [ ] Chrome stable channel
- [ ] Chrome beta channel (if available)
- [ ] Edge (Chromium-based)

## Store Submission Preparation

### Assets and Metadata
- [ ] Extension icons in all required sizes (16, 32, 48, 128, 256px)
- [ ] High-quality screenshots for store listing
- [ ] Detailed description written and proofread
- [ ] Privacy Policy updated and accessible
- [ ] Store category selected appropriately

### Compliance
- [ ] Privacy Policy aligned with actual data collection
- [ ] GDPR compliance verified if applicable
- [ ] OAuth scopes documented and justified
- [ ] Third-party service usage disclosed

### Upload Process
- [ ] Extension ZIP file under 128MB
- [ ] Manifest version incremented from previous store version
- [ ] Developer account in good standing
- [ ] Store listing updated with new version notes

## Post-Submission

### Monitoring
- [ ] Extension review status monitored
- [ ] Error reporting configured and monitored
- [ ] User feedback mechanisms in place
- [ ] Analytics configured (if applicable)

### Documentation
- [ ] Internal deployment notes updated
- [ ] API documentation current
- [ ] User support documentation updated
- [ ] Development team notified of release

## Rollback Plan
- [ ] Previous version build artifacts preserved
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured for critical failures
- [ ] Escalation procedures defined

---

## Quick Command Reference

```bash
# Complete production build and validation
npm run clean
npm run build:prod
node scripts/ci-validate.mjs dist/manifest.json
npm run zip:prod

# Emergency validation check
node scripts/ci-validate.mjs dist/manifest.json

# File size check
du -sh dist/ && du -sh extension.zip
```

## Success Criteria
- ✅ All checklist items completed
- ✅ `ci-validate.mjs` exits with code 0
- ✅ Extension loads without errors in fresh Chrome profile
- ✅ Core user flows complete successfully
- ✅ Privacy and security requirements met