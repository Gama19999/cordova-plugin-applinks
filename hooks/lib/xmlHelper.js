/*
 * Small helper class to read/write from/to xml file
 */

var fs = require('fs');
const xml2js = require('xml2js');

module.exports = {
  readXmlAsJson: readXmlAsJson,
  writeJsonAsXml: writeJsonAsXml
};

/**
 * Read data from the xml file as JSON object
 * @param {String} filePath - Absolute path to xml file
 * @return {Object} JSON object with the contents of the xml file
 */
function readXmlAsJson(filePath) {
  let xmlData;
  let xmlParser;
  let parsedData;
  try {
    xmlData = fs.readFileSync(filePath, 'utf8');
    xmlParser = new xml2js.Parser();
    xmlParser.parseString(xmlData, function(err, data) {
      if (data) parsedData = data;
    });
  } catch (err) { console.error(err); }
  return parsedData;
}

/**
 * Write JSON object as xml into the specified file
 * @param {Object} jsData - JSON object to write
 * @param {String} filePath - Path to the xml file where data should be saved
 * @return {boolean} true - If data saved to file; false - Otherwise
 */
function writeJsonAsXml(jsData, filePath, options) {
  let xmlBuilder = new xml2js.Builder(options);
  let changedXmlData = xmlBuilder.buildObject(jsData);
  let isSaved = true;
  try {
    fs.writeFileSync(filePath, changedXmlData, 'utf8');
  } catch (err) {
    console.error(err);
    isSaved = false;
  }
  return isSaved;
}
