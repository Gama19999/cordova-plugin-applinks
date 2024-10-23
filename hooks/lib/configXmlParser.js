/*
 * Parser for config.xml file
 * Read plugin-specific preferences (from <applink /> tag) as JSON object
 */

var path = require('path');
var ConfigXmlHelper = require('./configXmlHelper.js');
const DEFAULT_SCHEME = 'http';

module.exports = { readPreferences: readPreferences };

/**
 * Read plugin preferences from the config.xml file
 * @param {Object} cordovaContext - Cordova context object
 * @return {Array} List of host objects
 */
function readPreferences(cordovaContext) {
  let configXml = new ConfigXmlHelper(cordovaContext).read(); // Read data from projects root config.xml file
  if (configXml == null) {
    console.warn('config.xml file not found! Please, check that it exist\'s in your project\'s root directory.');
    return null;
  }
  // Look for data from the <applink /> tag
  let ulXmlPreferences = configXml.widget['applink'];
  if (ulXmlPreferences == null || ulXmlPreferences.length == 0) {
    console.warn('<applink /> tag is not set in the config.xml - AppLinks plugin is not going to work.');
    return null;
  }
  let xmlPreferences = ulXmlPreferences[0];
  let hosts = constructHostsList(xmlPreferences); // Read <al-host /> tags
  let iosTeamId = getTeamIdPreference(xmlPreferences); // Read ios team ID
  return {
    'hosts': hosts,
    'iosTeamId': iosTeamId
  };
}

/**
 * Construct list of <al-host /> objects, defined in config.xml file
 * @param {Object} xmlPreferences - Plugin preferences from config.xml as JSON object
 * @return {Array} Array of JSON objects, where each entry defines <al-host /> data from config.xml file
 */
function constructHostsList(xmlPreferences) {
  let hostsList = [];
  let xmlHostList = xmlPreferences['al-host']; // Look for defined hosts
  if (xmlHostList == null || xmlHostList.length == 0) return [];
  xmlHostList.forEach(function(xmlElement) {
    let host = constructHostEntry(xmlElement);
    if (host) hostsList.push(host);
  });
  return hostsList;
}

/**
 * Construct host object from xml data
 * @param {Object} xmlElement - xml data to process
 * @return {Object} Host entry as JSON object
 */
function constructHostEntry(xmlElement) {
  let host = {
      scheme: DEFAULT_SCHEME,
      name: '',
      paths: []
    };
  let hostProperties = xmlElement['$'];
  if (hostProperties == null || hostProperties.length == 0) return null;
  host.name = hostProperties.name; // Read host name
  // Read scheme if defined
  if (hostProperties['scheme'] != null) host.scheme = hostProperties.scheme;
  host.paths = constructPaths(xmlElement); // Construct paths list, defined for the given host
  return host;
}

/**
 * Construct list of path objects from the xml data
 * @param {Object} xmlElement - xml data to process
 * @return {Array} List of path entries, each on is a JSON object
 */
function constructPaths(xmlElement) {
  if (xmlElement['path'] == null) return ['*'];
  let paths = [];
  xmlElement.path.some(function(pathElement) {
    let url = pathElement['$']['url'];
    // Ignore explicit paths if '*' is defined
    if (url === '*') {
      paths = ['*'];
      return true;
    }
    paths.push(url);
  });
  return paths;
}

/**
 * Get iOS TeamIDPreferences, defined in config.xml file
 * @param {Object} xmlPreferences - Plugin preferences from config.xml as JSON object
 * @return {Array} Array of iOS TeamID preferences data from config.xml file
 */
function getTeamIdPreference(xmlPreferences) {
  if (xmlPreferences.hasOwnProperty('ios-team-id')) return xmlPreferences['ios-team-id'][0]['$']['value'];
  return null;
}