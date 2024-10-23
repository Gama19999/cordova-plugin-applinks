/**
 * Hook is executed when plugin is added to the project
 * It will check all necessary module dependencies and install the missing ones locally
 */

const path = require('path');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;
const pluginNpmDependencies = require('../package.json').dependencies;
const INSTALLATION_FLAG_FILE_NAME = '.npmInstalled';

module.exports = function(ctx) {
  if (isInstallationAlreadyPerformed(ctx)) return;
  console.log('Installing dependency packages: ');
  console.log(JSON.stringify(pluginNpmDependencies, null, 2));
  let npm = (process.platform === "win32" ? "npm.cmd" : "npm");
  let result = spawnSync(npm, ['install', '--production'], { cwd: './plugins/' + ctx.opts.plugin.id });
  if (result.error) throw result.error;
  createPluginInstalledFlag(ctx);
};

/**
 * Check if this hook was already executed
 * @param {Object} ctx Cordova context
 * @return {Boolean} [true] if already executed, [false] otherwise
 */
function isInstallationAlreadyPerformed(ctx) {
  let pathToInstallFlag = path.join(ctx.opts.projectRoot, 'plugins', ctx.opts.plugin.id, INSTALLATION_FLAG_FILE_NAME);
  try {
    fs.accessSync(pathToInstallFlag, fs.F_OK);
    return true;
  } catch (err) { return false; }
}

/**
 * Create empty file - indicator, that we tried to install dependency modules after installation
 * We have to do that, or this hook is gonna be called on any plugin installation
 */
function createPluginInstalledFlag(ctx) {
  let pathToInstallFlag = path.join(ctx.opts.projectRoot, 'plugins', ctx.opts.plugin.id, INSTALLATION_FLAG_FILE_NAME);
  fs.closeSync(fs.openSync(pathToInstallFlag, 'w'));
}
