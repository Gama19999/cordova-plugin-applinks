package ovh.serial30.cordova.applinks;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.text.TextUtils;
import android.widget.Toast;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONException;
import ovh.serial30.cordova.applinks.constants.Const;
import ovh.serial30.cordova.applinks.parser.AppLinkConfigXMLParser;
import ovh.serial30.cordova.applinks.pojos.AppLinkHost;
import ovh.serial30.cordova.applinks.pojos.AppLinkPath;
import ovh.serial30.cordova.applinks.pojos.AppLinkJson;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AppLinks cordova plugin Java main class
 * Establishes communication between Java and JS sides, handles launch intents verifying if they are AppLinks or not and so on
 * @author Gamaliel Rios
 */
public class AppLinksPlugin extends CordovaPlugin {
    private List<AppLinkHost> supportedHosts; // List of applink-hosts, defined in config.xml as <al-host />
    private Map<String, CallbackContext> subscribers; // List of JS subscribers
    private AppLinkJson jsonMessage; // AppLink json message, that is captured on application launch
    private Context appContext;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        appContext = cordova.getActivity();
        supportedHosts = new AppLinkConfigXMLParser(appContext).parse();
        if (subscribers == null) subscribers = new HashMap<String, CallbackContext>();
        handleIntent(cordova.getActivity().getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) { handleIntent(intent); }

    /**
     * Handle the launch intent<br>If it is an AppLink intent then event will be dispatched to the JS side
     * @param intent Application launch intent
     */
    private void handleIntent(Intent intent) {
        if (intent == null) return;

        // If app was launched by the AppLink url
        Uri launchUri = intent.getData(); // Retrieve intent URL

        // If app was not launched by the AppLink url then ignore
        if (!Intent.ACTION_VIEW.equals(intent.getAction()) || launchUri == null) {
            Toast.makeText(appContext, Const.ToastMSG.APP_LAUNCH, Toast.LENGTH_SHORT).show();
            return;
        } else Toast.makeText(appContext, Const.ToastMSG.URL_LAUNCH, Toast.LENGTH_SHORT).show();

        // Try to find host in the applink-hosts list from the config.xml file
        AppLinkHost host = findAppLinkHostByUrl(launchUri);
        if (host == null) {
            Toast.makeText(appContext, Const.ToastMSG.UNKNOWN_HOST + launchUri.getHost(), Toast.LENGTH_SHORT).show();
            return;
        }
        
        // Store json message and try to consume it
        jsonMessage = new AppLinkJson(host, launchUri, appContext);
        tryToConsumeEvent();
    }

    /**
     * Find applink-host entry that matches the launch url
     * @param url Launch url
     * @return AppLinkHost entry<br>{@code null} If none was found
     */
    private AppLinkHost findAppLinkHostByUrl(Uri url) {
        AppLinkHost host = null;
        final String launchHost = url.getHost().toLowerCase();
        for (AppLinkHost supportedHost : supportedHosts) {
            if (supportedHost.getHostName().equals(launchHost) ||
                supportedHost.getHostName().startsWith("*.") && launchHost.endsWith(supportedHost.getHostName().substring(1))) {
                host = supportedHost;
                break;
            }
        }
        return host;
    }

    /**
     * Try to send event to the JS subscribers
     */
    private void tryToConsumeEvent() {
        if (subscribers.size() == 0 || jsonMessage == null) return;
        final String storedEventName = jsonMessage.getJsEvent();
        final Set<Map.Entry<String, CallbackContext>> subscribersSet = subscribers.entrySet();
        for (Map.Entry<String, CallbackContext> subscriber : subscribersSet) {
            final String subscriberJsEvent = subscriber.getKey();
            if (Const.Events.FILE_DOWNLOAD.equals(storedEventName)) {
                downloadFile(subscriber);
                break;
            } else if (subscriberJsEvent.equals(storedEventName)) {
                sendMessageToJs(jsonMessage, subscriber.getValue());
                jsonMessage = null;
                break;
            }
        }
    }

    /**
     * Logic behind in-app file download
     * @param subscriber Entry containing JSEventName as key and JSCallback as value
     */
    private void downloadFile(Map.Entry<String, CallbackContext> subscriber) {
        Uri url = Uri.parse(jsonMessage.getJsDataURL());
        String fileName = url.getPathSegments().get(url.getPathSegments().size() - 1);
        DownloadManager.Request request = new DownloadManager.Request(url);
        request.setTitle("File: " + fileName);
        request.setDescription("Inn-App download...");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
        Toast.makeText(appContext, Const.ToastMSG.DOWNLOAD_START, Toast.LENGTH_SHORT).show();
        DownloadManager downloadManager = (DownloadManager) appContext.getSystemService(Context.DOWNLOAD_SERVICE);
        downloadManager.enqueue(request);
        sendMessageToJs(jsonMessage, subscriber.getValue());
        jsonMessage = null;
    }

    /**
     * Send message to JS side
     * @param message  AppLinkJson message to send
     * @param callback To what callback we are sending the message
     */
    private void sendMessageToJs(AppLinkJson message, CallbackContext callback) {
        final PluginResult result = new PluginResult(PluginResult.Status.OK, message);
        result.setKeepCallback(true);
        callback.sendPluginResult(result);
    }

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {
        boolean wasHandled = true;
        if (Const.Actions.SUBSCRIBE.equals(action)) subscribeForEvent(args, callbackContext);
        else if (Const.Actions.UNSUBSCRIBE.equals(action)) unsubscribeFromEvent(args);
        else wasHandled = false;
        return wasHandled;
    }

    /**
     * Add subscriber for the JS event
     * @param arguments Arguments passed from JS side
     * @param callbackContext Callback to use when event is captured
     */
    private void subscribeForEvent(final CordovaArgs arguments, final CallbackContext callbackContext) {
        final String jsEventName = getJSEventNameFromArguments(arguments);
        if (TextUtils.isEmpty(jsEventName)) return;
        subscribers.put(jsEventName, callbackContext);
        tryToConsumeEvent();
    }

    /**
     * Remove subscriber from the JS event
     * @param arguments Arguments passed from JS side
     */
    private void unsubscribeFromEvent(final CordovaArgs arguments) {
        if (subscribers.size() == 0) return;
        final String jsEventName = getJSEventNameFromArguments(arguments);
        if (TextUtils.isEmpty(jsEventName)) return;
        subscribers.remove(jsEventName);
    }

    /**
     * Get JS event name from the cordova arguments
     * @param arguments Received arguments from JS side
     * @return JS event name<br>{@code null} If none was found
     */
    private String getJSEventNameFromArguments(final CordovaArgs arguments) {
        String jsEventName = null;
        try {
            jsEventName = arguments.getString(0);
        } catch (JSONException e) {
            Toast.makeText(appContext, Const.ToastMSG.JS_GET_EVENT_NAME_ERR + "\n" + e, Toast.LENGTH_SHORT).show();
        }
        return jsEventName;
    }
}
