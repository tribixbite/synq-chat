#!/usr/bin/env pwsh
# Diagnostic Script for Synq-Chat Multi-App Platform

Write-Host "=== SYNQ-CHAT DIAGNOSTIC SCRIPT ===" -ForegroundColor Green
Write-Host ""

# 1. Check Build Outputs
Write-Host "1. CHECKING BUILD OUTPUTS:" -ForegroundColor Yellow
Write-Host "   Checking public/apps structure..."

if (Test-Path "public/apps") {
    Get-ChildItem "public/apps" -Recurse | Select-Object FullName, Length | Format-Table -AutoSize
} else {
    Write-Host "   ❌ public/apps directory not found!" -ForegroundColor Red
}

Write-Host ""

# 2. Check App Directories
Write-Host "2. CHECKING APP DIRECTORIES:" -ForegroundColor Yellow
$apps = @("vibesynq", "admin")
foreach ($app in $apps) {
    $appPath = "public/apps/$app"
    Write-Host "   Checking $app app..."
    
    if (Test-Path $appPath) {
        Write-Host "   ✅ $appPath exists" -ForegroundColor Green
        
        # Check for index.html
        if (Test-Path "$appPath/index.html") {
            Write-Host "   ✅ $appPath/index.html exists" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $appPath/index.html missing!" -ForegroundColor Red
        }
        
        # Check for assets directory
        if (Test-Path "$appPath/assets") {
            Write-Host "   ✅ $appPath/assets exists" -ForegroundColor Green
            $assetCount = (Get-ChildItem "$appPath/assets" -File).Count
            Write-Host "   📁 $assetCount files in assets directory" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ $appPath/assets missing!" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ $appPath does not exist!" -ForegroundColor Red
    }
}

Write-Host ""

# 3. Check Vite Configurations
Write-Host "3. CHECKING VITE CONFIGURATIONS:" -ForegroundColor Yellow
$viteConfigs = @("apps/vibesynq/vite.config.ts", "apps/admin/vite.config.ts")
foreach ($config in $viteConfigs) {
    if (Test-Path $config) {
        Write-Host "   ✅ $config exists" -ForegroundColor Green
        # Check base path configuration
        $content = Get-Content $config -Raw
        if ($content -match 'base:\s*mode\s*===\s*Env\.Production\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"') {
            Write-Host "   📝 Base path: Production='$($matches[1])' Development='$($matches[2])'" -ForegroundColor Cyan
        } elseif ($content -match 'base:\s*"([^"]+)"') {
            Write-Host "   📝 Base path: '$($matches[1])'" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ❌ $config missing!" -ForegroundColor Red
    }
}

Write-Host ""

# 4. Check Server Configuration
Write-Host "4. CHECKING SERVER CONFIGURATION:" -ForegroundColor Yellow
if (Test-Path "src/server/plugins/subdomainPlugin.ts") {
    Write-Host "   ✅ subdomainPlugin.ts exists" -ForegroundColor Green
    $content = Get-Content "src/server/plugins/subdomainPlugin.ts" -Raw
    
    # Check static plugin configurations
    $staticConfigs = [regex]::Matches($content, 'staticPlugin\(\s*\{\s*assets:\s*"([^"]+)",\s*prefix:\s*"([^"]+)"')
    Write-Host "   📝 Static plugin configurations:" -ForegroundColor Cyan
    foreach ($match in $staticConfigs) {
        Write-Host "     - Assets: $($match.Groups[1].Value) → Prefix: $($match.Groups[2].Value)" -ForegroundColor White
    }
    
    # Check manual routes
    $manualRoutes = [regex]::Matches($content, '\.get\("([^"]+)"')
    Write-Host "   📝 Manual routes configured:" -ForegroundColor Cyan
    foreach ($match in $manualRoutes) {
        Write-Host "     - $($match.Groups[1].Value)" -ForegroundColor White
    }
} else {
    Write-Host "   ❌ subdomainPlugin.ts missing!" -ForegroundColor Red
}

Write-Host ""

# 5. Check Package.json Scripts
Write-Host "5. CHECKING PACKAGE.JSON SCRIPTS:" -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $scripts = $packageJson.scripts
    
    Write-Host "   📝 Build scripts:" -ForegroundColor Cyan
    Write-Host "     - build:all: $($scripts.'build:all')" -ForegroundColor White
    Write-Host "     - build:vibesynq: $($scripts.'build:vibesynq')" -ForegroundColor White
    Write-Host "     - build:admin: $($scripts.'build:admin')" -ForegroundColor White
} else {
    Write-Host "   ❌ package.json missing!" -ForegroundColor Red
}

Write-Host ""

# 6. Test Build Process
Write-Host "6. TESTING BUILD PROCESS:" -ForegroundColor Yellow
Write-Host "   Running build:all..." -ForegroundColor Cyan

try {
    $buildOutput = & bun run build:all 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build completed successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        Write-Host "   Build output:" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 7. Check Compiled Server
Write-Host "7. CHECKING COMPILED SERVER:" -ForegroundColor Yellow
if (Test-Path "main.exe") {
    $fileInfo = Get-Item "main.exe"
    Write-Host "   ✅ main.exe exists (Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB)" -ForegroundColor Green
    Write-Host "   📅 Last modified: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ main.exe not found!" -ForegroundColor Red
    Write-Host "   Running compile..." -ForegroundColor Cyan
    try {
        & bun run compile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Compilation successful" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Compilation failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Compilation error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# 8. Recommendations
Write-Host "8. RECOMMENDATIONS:" -ForegroundColor Yellow

$issues = @()
$fixes = @()

# Check for common issues
if (-not (Test-Path "public/apps/vibesynq/assets")) {
    $issues += "Missing vibesynq assets directory"
    $fixes += "Run 'bun run build:vibesynq' to rebuild"
}

if (-not (Test-Path "public/apps/admin/assets")) {
    $issues += "Missing admin assets directory"
    $fixes += "Run 'bun run build:admin' to rebuild"
}

# Check for static plugin issues
$subdomainContent = ""
if (Test-Path "src/server/plugins/subdomainPlugin.ts") {
    $subdomainContent = Get-Content "src/server/plugins/subdomainPlugin.ts" -Raw
}

if ($subdomainContent -notmatch 'staticPlugin\(\s*\{\s*assets:\s*"\./public/apps/vibesynq"') {
    $issues += "Static plugin for vibesynq may be misconfigured"
    $fixes += "Check staticPlugin configuration in subdomainPlugin.ts"
}

# Check for base path issues
$viteConfigs = @("apps/vibesynq/vite.config.ts", "apps/admin/vite.config.ts")
foreach ($config in $viteConfigs) {
    if (Test-Path $config) {
        $content = Get-Content $config -Raw
        if ($content -match 'base:\s*mode\s*===\s*Env\.Production\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"') {
            $viteBasePath = $matches[1]
            $serverBasePath = $matches[2]
            if ($viteBasePath -ne $serverBasePath) {
                $issues += "Base path mismatch between Vite and server"
                $fixes += "Check base path configuration in $config"
            }
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host "   ✅ No obvious issues detected!" -ForegroundColor Green
    Write-Host "   💡 If assets are still not loading, the issue may be:" -ForegroundColor Cyan
    Write-Host "     - ElysiaJS static plugin configuration" -ForegroundColor White
    Write-Host "     - Route precedence (manual routes vs static plugin)" -ForegroundColor White
    Write-Host "     - Base path mismatches between Vite and server" -ForegroundColor White
} else {
    Write-Host "   ⚠️  Issues found:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "     - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "   🔧 Suggested fixes:" -ForegroundColor Green
    foreach ($fix in $fixes) {
        Write-Host "     - $fix" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== DIAGNOSTIC COMPLETE ===" -ForegroundColor Green 
