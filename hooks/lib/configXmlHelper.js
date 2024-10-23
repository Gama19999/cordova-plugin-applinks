/*
 * Helper class to read data from config.xml file
 */

var path = require('path');
var xmlHelper = require('./xmlHelper.js');
const ANDROID = 'android';
const IOS = 'ios';
const CONFIG_FILE_NAME = 'config.xml';
let context;
let projectRoot;

module.exports = ConfigXmlHelper;

/**
 * Constructor
 * @param {Object} cordovaContext - Cordova context object
 */
function ConfigXmlHelper(cordovaContext) {
  context = cordovaContext;
  projectRoot = context.opts.projectRoot;
}

/**
 * Read config.xml data as JSON object
 * @return {Object} JSON object with data from config.xml
 */
ConfigXmlHelper.prototype.read = function() {
  let filePath = getConfigXmlFilePath();
  return xmlHelper.readXmlAsJson(filePath);
}

/**
 * Get absolute path to the config.xml file
 */
const getConfigXmlFilePath = () => { return path.join(projectRoot, CONFIG_FILE_NAME); }

/**
 * Get package name for the application; it depends on the platform
 * @param {String} platform - 'ios' or 'android'; for what platform we need a package name
 * @return {String} Package/bundle name
 */
ConfigXmlHelper.prototype.getPackageName = function(platform) {
  let configFilePath = getConfigXmlFilePath();
  let config = getCordovaConfigParser(configFilePath);
  let packageName;
  if (platform === ANDROID) packageName = config.android_packageName();
  if (platform === IOS) packageName = config.ios_CFBundleIdentifier();
  if (packageName === undefined || packageName.length == 0) packageName = config.packageName();
  return packageName;
}

/**
 * Get config parser from cordova library
 * @param {String} configFilePath Absolute path to the config.xml file
 * @return {Object} Cordova config parser
 */
function getCordovaConfigParser(configFilePath) {
  let ConfigParser;
  try {
    // If we are running Cordova 5.4 or above - use parser from cordova-common
    ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
  } catch (e) {
    // Otherwise - from cordova-lib
    ConfigParser = context.requireCordovaModule('cordova-lib/src/configparser/ConfigParser')
  }
  return new ConfigParser(configFilePath);
}

/**
 * Get name of the current project from config.xml
 * @return {String} Name of the project
 */
ConfigXmlHelper.prototype.getProjectName = function() {
  let configFilePath = getConfigXmlFilePath();
  return getCordovaConfigParser(configFilePath).name();
}
