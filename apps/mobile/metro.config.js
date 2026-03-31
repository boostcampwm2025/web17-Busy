const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 모노레포 내 모든 파일 감시
config.watchFolders = [workspaceRoot];

// Metro가 패키지를 찾을 위치 (로컬 → 루트 순)
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')];

// pnpm isolated 모드에서 심볼릭 링크 활성화 (비활성화하면 babel-preset-expo 못 찾음)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
