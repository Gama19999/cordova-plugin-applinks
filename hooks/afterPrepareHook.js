/**
 * Hook is executed at the end of the 'prepare' stage, usually, when you call 'cordova build'
 * It will inject required preferences in the platform-specific projects, based on <applink />
 * data you have specified in the projects config.xml file
 */

const configParser = require('./lib/configXmlParser.js');
const androidManifestWriter = require('./lib/android/manifestWriter.js');
const androidWebHook = require('./lib/android/webSiteHook.js');
/*
const iosProjectEntitlements = require('./lib/ios/projectEntitlements.js');
const iosAppSiteAssociationFile = require('./lib/ios/appleAppSiteAssociationFile.js');
const iosProjectPreferences = require('./lib/ios/xcodePreferences.js');
const IOS = 'ios';
*/
const ANDROID = 'android';

module.exports = function(ctx) { run(ctx); };

/**
 * Execute the hook
 * @param {Object} cordovaContext - Cordova context object
 */
function run(cordovaContext) {
  let pluginPreferences = configParser.readPreferences(cordovaContext);
  let platformsList = cordovaContext.opts.platforms;

  if (pluginPreferences == null) return; // if no preferences are found - exit

  // if no <al-host /> is defined - exit
  if (pluginPreferences.hosts == null || pluginPreferences.hosts.length == 0) {
    console.warn('No <al-host /> is specified in the config.xml. AppLinks plugin is not going to work.');
    return;
  }

  platformsList.forEach(function(platform) {
    if (platform === ANDROID) activateAppLinksForAndroid(cordovaContext, pluginPreferences);
    //if (platform === IOS) activateAppLinksForIos(cordovaContext, pluginPreferences);
  });
}

/**
 * Activate AppLinks for Android application
 * @param {Object} cordovaContext - Cordova context object
 * @param {Object} pluginPreferences - Plugin preferences from the config.xml file, content from <applink /> tags
 */
function activateAppLinksForAndroid(cordovaContext, pluginPreferences) {
  androidManifestWriter.writePreferences(cordovaContext, pluginPreferences); // Inject preferenes into AndroidManifest.xml file
  androidWebHook.generate(cordovaContext, pluginPreferences); // Generate html file with the <link /> tags that you should inject on the your website
}

/**
 * Activate AppLinks for iOS application
 * @param {Object} cordovaContext - Cordova context object
 * @param {Object} pluginPreferences - Plugin preferences from the config.xml file, content from <applink /> tags
 */
/*
function activateAppLinksForIos(cordovaContext, pluginPreferences) {
  iosProjectPreferences.enableAssociativeDomainsCapability(cordovaContext); // Modify xcode project preferences
  iosProjectEntitlements.generateAssociatedDomainsEntitlements(cordovaContext, pluginPreferences); // Generate entitlements file
  iosAppSiteAssociationFile.generate(cordovaContext, pluginPreferences); // Generate apple-site-association-file
}
*/
