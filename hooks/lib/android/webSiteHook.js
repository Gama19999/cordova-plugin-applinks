/*
 * Class that creates android_web_hook.html file in your Cordova project root folder
 * File holds <link /> tags, which are generated based on data, specified in config.xml
 * You need to include those tags on your website to link web pages to the content inside your application.¿
 * More documentation on that can be found here:
 * https://developer.android.com/training/app-indexing/enabling-app-indexing.html
 */

var fs = require('fs');
var path = require('path');
const mkpath = require('mkpath');
var ConfigXmlHelper = require('../configXmlHelper.js');
const WEB_HOOK_FILE_PATH = path.join('al_web_hooks', 'android', 'android_web_hook.html');
const WEB_HOOK_TPL_FILE_PATH = path.join('plugins', 'cordova-plugin-applinks', 'al_web_hooks', 'android_web_hook_tpl.html');
const LINK_PLACEHOLDER = '[__LINKS__]';
const LINK_TEMPLATE = '<link rel="alternate" href="android-app://<package_name>/<scheme>/<host><path>" />';

module.exports = { generate: generateWebHook };

/**
 * Generate website hook for android application
 * @param {Object} cordovaContext - Cordova context object
 * @param {Object} pluginPreferences - Plugin preferences from config.xml file; already parsed
 */
function generateWebHook(cordovaContext, pluginPreferences) {
  let projectRoot = cordovaContext.opts.projectRoot;
  let configXmlHelper = new ConfigXmlHelper(cordovaContext);
  let packageName = configXmlHelper.getPackageName('android');
  let template = readTemplate(projectRoot);
  if (template == null || template.length == 0) return; // If template was not found - exit
  let linksToInsert = generateLinksSet(projectRoot, packageName, pluginPreferences); // Generate hook content
  let hookContent = template.replace(LINK_PLACEHOLDER, linksToInsert);
  saveWebHook(projectRoot, hookContent); // Save hook
}

/**
 * Read hook teplate from plugin directory
 * @param {String} projectRoot - Absolute path to cordova's project root
 * @return {String} Data from the template file
 */
function readTemplate(projectRoot) {
  let filePath = path.join(projectRoot, WEB_HOOK_TPL_FILE_PATH);
  let tplData = null;
  try {
    tplData = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn('Template file for android web hook is not found!');
    console.warn(err);
  }
  return tplData;
}

/**
 * Generate list of <link /> tags based on plugin preferences
 * @param {String} projectRoot - Absolute path to cordova's project root
 * @param {String} packageName - Android application package name
 * @param {Object} pluginPreferences - Plugin preferences, defined in config.xml; already parsed
 * @return {String} List of <link /> tags
 */
function generateLinksSet(projectRoot, packageName, pluginPreferences) {
  let linkTpl = LINK_TEMPLATE.replace('<package_name>', packageName);
  let content = '';
  pluginPreferences.hosts.forEach(function(host) {
    host.paths.forEach(function(hostPath) {
      content += generateLinkTag(linkTpl, host.scheme, host.name, hostPath) + '\n';
    });
  });
  return content;
}

/**
 * Generate <link /> tag
 * @param {String} linkTpl - Template to use for tag generation
 * @param {String} scheme - Host scheme
 * @param {String} host - Host name
 * @param {String} path - Host path
 * @return {String} <link /> tag
 */
function generateLinkTag(linkTpl, scheme, host, path) {
  linkTpl = linkTpl.replace('<scheme>', scheme).replace('<host>', host);
  if (path == null || path === '*') return linkTpl.replace('<path>', '');
  if (path.indexOf('*') >= 0) path = path.replace(/\*/g, '.*'); // For android replace * with .* for pattern matching
  // Path should start with /
  if (path.indexOf('/') != 0) path = '/' + path;
  return linkTpl.replace('<path>', path);
}

/**
 * Save data to website hook file
 * @param {String} projectRoot - Absolute path to project root
 * @param {String} hookContent - Data to save
 * @return {boolean} true - If data was saved; Otherwise - false;
 */
function saveWebHook(projectRoot, hookContent) {
  let filePath = path.join(projectRoot, WEB_HOOK_FILE_PATH);
  let isSaved = true;
  createDirectoryIfNeeded(path.dirname(filePath)); // Ensure directory exists
  try {
    fs.writeFileSync(filePath, hookContent, 'utf8'); // Write data to file
  } catch (err) {
    console.warn('Failed to create android web hook!');
    console.warn(err);
    isSaved = false;
  }
  return isSaved;
}

/**
 * Create directory if it doesn't exist yet
 * @param {String} dir - Absolute path to directory
 */
function createDirectoryIfNeeded(dir) {
  try {
    mkpath.sync(dir);
  } catch (err) {
    console.log(err);
  }
}
