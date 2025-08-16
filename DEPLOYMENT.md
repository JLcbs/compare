# 🚀 Text Diff Desktop - Deployment Guide

## 📦 1. Platform-Specific Builds

### Windows Build
```bash
# Install dependencies
npm install

# Build for Windows (x64)
npm run tauri:build:win

# Output: src-tauri/target/release/bundle/msi/text-diff-desktop_1.0.0_x64.msi
```

### macOS Build
```bash
# Install dependencies
npm install

# Build for macOS (Universal)
npm run tauri:build:mac

# Output: src-tauri/target/release/bundle/dmg/text-diff-desktop_1.0.0.dmg
```

### Linux Build
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev \
    libappindicator3-dev librsvg2-dev patchelf

# Install project dependencies
npm install

# Build for Linux
npm run tauri:build:linux

# Outputs:
# - AppImage: src-tauri/target/release/bundle/appimage/text-diff-desktop_1.0.0_amd64.AppImage
# - Deb: src-tauri/target/release/bundle/deb/text-diff-desktop_1.0.0_amd64.deb
```

## 🔒 2. Code Signing

### Windows Code Signing
1. Obtain a code signing certificate from a trusted CA
2. Install the certificate in the Windows certificate store
3. Sign the MSI installer:
```powershell
signtool sign /f certificate.pfx /p <password> \
    /tr http://timestamp.digicert.com /td sha256 /fd sha256 \
    text-diff-desktop_1.0.0_x64.msi
```

### macOS Code Signing & Notarization
1. Enroll in Apple Developer Program
2. Create Developer ID certificates
3. Sign the application:
```bash
# Sign the app
codesign --deep --force --verify --verbose \
    --sign "Developer ID Application: Your Name (TEAM_ID)" \
    text-diff-desktop.app

# Create DMG
create-dmg text-diff-desktop_1.0.0.dmg text-diff-desktop.app

# Sign DMG
codesign --sign "Developer ID Application: Your Name (TEAM_ID)" \
    text-diff-desktop_1.0.0.dmg

# Notarize
xcrun altool --notarize-app \
    --primary-bundle-id "com.textdiff.desktop" \
    --username "apple-id@example.com" \
    --password "app-specific-password" \
    --file text-diff-desktop_1.0.0.dmg

# Staple notarization
xcrun stapler staple text-diff-desktop_1.0.0.dmg
```

## 🌐 3. Distribution Channels

### GitHub Releases
1. Create a new release on GitHub
2. Upload platform-specific installers
3. Generate release notes from commits

### Microsoft Store (Windows)
1. Convert MSI to MSIX using MSIX Packaging Tool
2. Create app listing in Partner Center
3. Submit for certification

### Mac App Store (macOS)
1. Configure app for App Store distribution
2. Archive and upload via Xcode
3. Submit for review

### Snap Store (Linux)
1. Create snapcraft.yaml configuration
2. Build snap package: `snapcraft`
3. Upload to Snap Store: `snapcraft upload --release=stable`

## 🔄 4. Auto-Update System

### Configuration
Edit `src-tauri/tauri.conf.json`:
```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://releases.yourdomain.com/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

### Update Server Setup
1. Generate signing keys:
```bash
npx tauri signer generate -w ~/.tauri/text-diff-desktop.key
```

2. Create update manifest:
```json
{
  "version": "1.0.1",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2024-01-20T12:00:00Z",
  "platforms": {
    "darwin-universal": {
      "signature": "...",
      "url": "https://github.com/.../text-diff-desktop_1.0.1.dmg"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../text-diff-desktop_1.0.1_x64.msi"
    },
    "linux-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../text-diff-desktop_1.0.1_amd64.AppImage"
    }
  }
}
```

## 📦 5. CI/CD Pipeline

### GitHub Actions Workflow
See `.github/workflows/release.yml` for automated builds

### Environment Secrets Required
- `GITHUB_TOKEN`: For creating releases
- `TAURI_PRIVATE_KEY`: For signing updates
- `TAURI_KEY_PASSWORD`: Password for private key
- `APPLE_DEVELOPER_ID`: For macOS signing
- `APPLE_ID`: Apple ID for notarization
- `APPLE_APP_PASSWORD`: App-specific password
- `WINDOWS_CERT_PASSWORD`: Windows certificate password

## 📋 6. Pre-Release Checklist

- [ ] Update version in `package.json` and `Cargo.toml`
- [ ] Run all tests: `npm test && cargo test`
- [ ] Build for all platforms locally
- [ ] Test auto-update mechanism
- [ ] Update CHANGELOG.md
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag to trigger CI/CD: `git push origin v1.0.0`

## 🔧 7. Troubleshooting

### Windows Build Issues
- Ensure Visual Studio Build Tools are installed
- Check that WebView2 runtime is available
- Verify certificate is valid and not expired

### macOS Build Issues
- Ensure Xcode Command Line Tools are installed
- Check Developer ID certificate is valid
- Verify notarization credentials

### Linux Build Issues
- Install all required system libraries
- Check GTK and WebKit versions
- Ensure AppImage tools are available

## 📊 8. Performance Optimization

### Build Size Reduction
```toml
# Cargo.toml
[profile.release]
opt-level = "z"     # Optimize for size
lto = true          # Link-time optimization
codegen-units = 1   # Single codegen unit
strip = true        # Strip symbols
```

### Startup Time Optimization
- Enable lazy loading for heavy modules
- Minimize initial bundle size
- Use production builds of dependencies

## 📞 9. Support Channels

- GitHub Issues: Bug reports and feature requests
- Discord: Community support
- Email: enterprise@textdiff.com
- Documentation: https://docs.textdiff.com