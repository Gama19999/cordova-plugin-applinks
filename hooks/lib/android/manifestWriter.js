/**
 * Class that injects plugin preferences into AndroidManifest.xml file
 */

var path = require('path');
var xmlHelper = require('../xmlHelper.js');

module.exports = { writePreferences: writePreferences };

/**
 * Inject preferences into AndroidManifest.xml file
 * @param {Object} cordovaContext - Cordova context object
 * @param {Object} pluginPreferences - Plugin preferences as JSON object; already parsed
 */
function writePreferences(cordovaContext, pluginPreferences) {
  let pathToManifest = path.join(cordovaContext.opts.projectRoot, 'platforms', 'android', 'AndroidManifest.xml');
  let manifestSource = xmlHelper.readXmlAsJson(pathToManifest);
  let cleanManifest;
  let updatedManifest;
  /**
   * Cordova-Android 7.0+ FIX
   * cordova-android 7.0+ changes the path to AndroidManifest
   * So if manifestSource/manifestData is empty (or undefined) we assume is cordova-android 7.0+
   * @see http://cordova.apache.org/announcements/2017/12/04/cordova-android-7.0.0.html
   */
  if (!manifestSource) {
    pathToManifest = path.join(cordovaContext.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    manifestSource = xmlHelper.readXmlAsJson(pathToManifest);
  }
  cleanManifest = removeOldOptions(manifestSource); // Remove old intent-filters
  updatedManifest = injectOptions(cleanManifest, pluginPreferences); // Inject intent-filters based on plugin preferences
  xmlHelper.writeJsonAsXml(updatedManifest, pathToManifest); // Save new version of the AndroidManifest.xml
}

/**
 * Remove old intent-filters from the manifest file
 * @param {Object} manifestData - Manifest content as JSON object
 * @return {Object} Manifest data without old intent-filters
 */
function removeOldOptions(manifestData) {
  let cleanManifest = manifestData;
  let activities = manifestData['manifest']['application'][0]['activity'];
  activities.forEach(removeIntentFiltersFromActivity);
  cleanManifest['manifest']['application'][0]['activity'] = activities;
  return cleanManifest;
}

/**
 * Remove old intent filters from the given activity
 * @param {Object} activity - Activity, from which we need to remove intent-filters. Changes applied to the passed object
 */
function removeIntentFiltersFromActivity(activity) {
  let oldIntentFilters = activity['intent-filter'];
  let newIntentFilters = [];
  if (oldIntentFilters == null || oldIntentFilters.length == 0) return;
  oldIntentFilters.forEach(function(intentFilter) {
    if (!isIntentFilterForAppLinks(intentFilter)) newIntentFilters.push(intentFilter);
  });
  activity['intent-filter'] = newIntentFilters;
}

/**
 * Check if given intent-filter is for AppLinks
 * @param {Object} intentFilter - intent-filter to check
 * @return {Boolean} true - If is intent-filter for AppLinks; Otherwise - false;
 */
function isIntentFilterForAppLinks(intentFilter) {
  let actions = intentFilter['action'];
  let categories = intentFilter['category'];
  let data = intentFilter['data'];
  return isActionForAppLinks(actions) &&
    containsCategoriesForAppLinks(categories) &&
    isDataTagForAppLinks(data);
}

/**
 * Check if actions from the intent-filter corresponds to actions for AppLinks
 * @param {Array} actions - List of actions in the intent-filter
 * @return {Boolean} true - If action for AppLinks; Otherwise - false
 */
function isActionForAppLinks(actions) {
  // There can be only 1 action
  if (actions == null || actions.length != 1) return false;
  let action = actions[0]['$']['android:name'];
  return ('android.intent.action.VIEW' === action);
}

/**
 * Check if categories in the intent-filter corresponds to categories for AppLinks
 * @param {Array} categories - List of categories in the intent-filter
 * @return {Boolean} true - If action for AppLinks; Otherwise - false
 */
function containsCategoriesForAppLinks(categories) {
  // There can be only 2 categories
  if (categories == null || categories.length != 2) return false;
  let isBrowsable = false;
  let isDefault = false;
  // Check intent categories
  categories.forEach(function(category) {
    let categoryName = category['$']['android:name'];
    if (!isBrowsable) isBrowsable = 'android.intent.category.BROWSABLE' === categoryName;
    if (!isDefault) isDefault = 'android.intent.category.DEFAULT' === categoryName;
  });
  return isDefault && isBrowsable;
}

/**
 * Check if data tag from intent-filter corresponds to data for AppLinks
 * @param {Array} data - List of data tags in the intent-filter
 * @return {Boolean} true - If data tag for AppLinks; Otherwise - false
 */
function isDataTagForAppLinks(data) {
  // Can have only 1 data tag in the intent-filter
  if (data == null || data.length != 1) return false;
  let dataHost = data[0]['$']['android:host'];
  let dataScheme = data[0]['$']['android:scheme'];
  let hostIsSet = dataHost != null && dataHost.length > 0;
  let schemeIsSet = dataScheme != null && dataScheme.length > 0;
  return hostIsSet && schemeIsSet;
}

/**
 * Inject options into AndroidManifest.xml file
 * @param {Object} manifestData - Manifest content where preferences should be injected
 * @param {Object} pluginPreferences - Plugin preferences from config.xml; already parsed
 * @return {Object} Updated manifest data with corresponding intent-filters
 */
function injectOptions(manifestData, pluginPreferences) {
  let changedManifest = manifestData;
  let activitiesList = changedManifest['manifest']['application'][0]['activity'];
  let launchActivityIndex = getMainLaunchActivityIndex(activitiesList);
  let alIntentFilters = [];
  let launchActivity;
  if (launchActivityIndex < 0) {
    console.warn('Could not find launch activity in the AndroidManifest file. Can\'t inject AppLinks preferences.');
    return;
  }
  launchActivity = activitiesList[launchActivityIndex]; // Get launch activity
  // Generate intent-filters
  pluginPreferences.hosts.forEach(function(host) {
    host.paths.forEach(function(hostPath) {
      alIntentFilters.push(createIntentFilter(host.name, host.scheme, hostPath));
    });
  });
  // Add AppLinks intent-filters to the launch activity
  launchActivity['intent-filter'] = launchActivity['intent-filter'].concat(alIntentFilters);
  return changedManifest;
}

/**
 * Find index of the applications launcher activity
 * @param {Array} activities - List of all activities in the app
 * @return {Integer} Index of the launch activity; -1 - if none was found
 */
function getMainLaunchActivityIndex(activities) {
  let launchActivityIndex = -1;
  activities.some(function(activity, index) {
    if (isLaunchActivity(activity)) {
      launchActivityIndex = index;
      return true;
    }
    return false;
  });
  return launchActivityIndex;
}

/**
 * Check if the given actvity is a launch activity
 * @param {Object} activity - Activity to check
 * @return {Boolean} true - If this is a launch activity; Otherwise - false
 */
function isLaunchActivity(activity) {
  let intentFilters = activity['intent-filter'];
  let isLauncher = false;
  if (intentFilters == null || intentFilters.length == 0) return false;
  isLauncher = intentFilters.some(function(intentFilter) {
    let action = intentFilter['action'];
    let category = intentFilter['category'];
    if (action == null || action.length != 1 || category == null || category.length != 1) return false;
    let isMainAction = ('android.intent.action.MAIN' === action[0]['$']['android:name']);
    let isLauncherCategory = ('android.intent.category.LAUNCHER' === category[0]['$']['android:name']);
    return isMainAction && isLauncherCategory;
  });
  return isLauncher;
}

/**
 * Create JSON object that represent intent-filter for <applink />
 * @param {String} host - Host name
 * @param {String} scheme - Host scheme
 * @param {String} pathName - Host path
 * @return {Object} intent-filter as a JSON object
 */
function createIntentFilter(host, scheme, pathName) {
  let intentFilter = {
    '$': {
      'android:autoVerify': 'true'
    },
    'action': [{
      '$': {
        'android:name': 'android.intent.action.VIEW'
      }
    }],
    'category': [{
      '$': {
        'android:name': 'android.intent.category.DEFAULT'
      }
    }, {
      '$': {
        'android:name': 'android.intent.category.BROWSABLE'
      }
    }],
    'data': [{
      '$': {
        'android:host': host,
        'android:scheme': scheme
      }
    }]
  };
  injectPathComponentIntoIntentFilter(intentFilter, pathName);
  return intentFilter;
}

/**
 * Inject host path into provided intent-filter
 * @param {Object} intentFilter - intent-filter object where path component should be injected
 * @param {String} pathName - Host path to inject
 */
function injectPathComponentIntoIntentFilter(intentFilter, pathName) {
  if (pathName == null || pathName === '*') return;
  let attrKey = 'android:path';
  if (pathName.indexOf('*') >= 0) {
    attrKey = 'android:pathPattern';
    pathName = pathName.replace(/\*/g, '.*');
  }
  if (pathName.indexOf('/') != 0) pathName = '/' + pathName;
  intentFilter['data'][0]['$'][attrKey] = pathName;
}
