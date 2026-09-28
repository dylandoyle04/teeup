// Lets the app import the web app's shared logic (../src) — packages, games,
// Ryder Cup, store — so both stay in sync.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, '../src')

const config = getDefaultConfig(projectRoot)
config.watchFolders = [sharedRoot]

// Web-only modules in ../src that get a native replacement here.
const SEAMS = {
  './platform': path.join(projectRoot, 'src/platform.ts'),
  './supabase': path.join(projectRoot, 'src/lib/supabase.ts'),
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (context.originModulePath.startsWith(sharedRoot + path.sep)) {
    if (SEAMS[moduleName]) {
      return { type: 'sourceFile', filePath: SEAMS[moduleName] }
    }
    // Resolve packages (react, zustand…) from mobile/node_modules, never the
    // web app's — two copies of React would crash the app.
    if (!moduleName.startsWith('.')) {
      return context.resolveRequest(
        { ...context, originModulePath: path.join(projectRoot, 'package.json') },
        moduleName,
        platform,
      )
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
