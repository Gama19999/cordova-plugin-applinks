const exec = require('cordova/exec');
const channel = require('cordova/channel'); 

const PLUGIN_NAME = 'AppLinks'; // Reference name for the plugin 
const DEFAULT_EVENT_NAME = 'launchedAppFromAppLink'; // Default event name that is used by the plugin


// Plugin methods on the native side that can be called from JavaScript
const pluginNativeMethod = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe'
};

const AppLinks = {
    alLink: null,
    host: '',
    eventName: null,
    regex: /\b[\w-]+$/gm, // /^.+token=/

    /**
     * Initialize the appLinks JS object
     */
    initialize: function() {
        let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        this.host = options.host || this.host;
        this.eventName = options.eventName || this.eventName;
        this.regex = options.regex || this.regex;
        this.bindEvents();
    },

    /**
     * Bind EventListeners
     */
    bindEvents: function() {
        let _this = this;
        document.addEventListener('deviceready', function() {
            _this.onDeviceReady();
        }, false);
    },

    /**
     *  deviceready EventHandler
     */
    onDeviceReady: function() {
        let _this = this;
        this.subscribe(_this.eventName, function(event) {
            _this.launchedAppFromAppLink(event);
        });
    },

    /**
     *  Store deeplink event
     */
    launchedAppFromAppLink: function(eventData) {
        this.alLink = eventData;
        console.log('Launched App From DeepLink:\n', eventData)
    },

    /**
     * Promise to check if the app uses the AppLinks or not
     * @param {number} milliseconds - Optional. The number of milliseconds to wait before executing the code. If omitted, the value 0 is used
     */
    checkDeepLink: function (milliseconds) {
        let _this = this;
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                if (_this.alLink)
                _this.validateDeeplink()
                resolve(_this.alLink);
            }, milliseconds || 0);
        });
    },

    /**
     * Validates the host and uses the regular expression to extract the value from the deeplink
     */
    validateDeeplink: function() {
        let regex = this.regex;
        let host = this.host;
        if (host) {
            this.alLink['host'] = host;
            this.alLink['match'] = this.alLink.url.indexOf(host) > -1;
        }
        if (regex) {
            this.alLink['regex'] = regex;
            this.alLink['value'] = this.alLink.url.match(regex) || this.alLink.hash.match(regex) || this.alLink.path.match(regex);
        }
    },

    /**
     * Subscribe to JS event
     * If plugin already captured that event - callback will be called immidietly
     * @param {String} eventName - Name of the JS event you are subscribing on; if null - default plugin event is used
     * @param {Function} callback - Callback that is called when event is captured
     */
    subscribe: function(eventName, callback) {
        if (!callback) {
            console.warn('AppLinks: can\'t subscribe to event without a callback');
            return;
        }
        if (!eventName) eventName = DEFAULT_EVENT_NAME;
        let innerCallback = (msg) => callback(msg.data);
        exec(innerCallback, null, PLUGIN_NAME, pluginNativeMethod.SUBSCRIBE, [eventName]);
    },

    /**
     * Unsubscribe from the JS event
     * @param {String} eventName - From what event we are unsubscribing
     */
    unsubscribe: function(eventName) {
        if (!eventName) eventName = DEFAULT_EVENT_NAME;
        exec(null, null, PLUGIN_NAME, pluginNativeMethod.UNSUBSCRIBE, [eventName]);
    }
};

if (!window.plugins) window.plugins = {};
window.plugins.appLinks = AppLinks;

module.exports = AppLinks;