package ovh.serial30.cordova.applinks.pojos;

import android.content.Context;
import android.net.Uri;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;
import ovh.serial30.cordova.applinks.constants.Const;

import java.util.List;

/**
 * Model for the message entry, that is send to JS
 * @author Gamaliel Rios
 */
public class AppLinkJson extends JSONObject {
    private Context appContext;
    private String jsEvent;

    public AppLinkJson(AppLinkHost host, Uri originalUri, Context appContext) {
        this.appContext = appContext;
        setPropertyJsEvent(host, originalUri);
        setMessageData(host, originalUri);
    }

    public String getJsEvent() { return jsEvent; }

    public String getJsDataURL() {
        String url = null;
        try {
            JSONObject data = getJSONObject(Const.JsonKeys.DATA);
            url = data.getString(Const.JsonKeys.ORIGIN);
        } catch (JSONException e) {
            Toast.makeText(appContext, Const.ToastMSG.JS_GET_EVENT_DATA_URL_ERR + "\n" + e, Toast.LENGTH_SHORT).show();
        }
        return url;
    }

    private void setPropertyJsEvent(AppLinkHost host, Uri originalUri) {
        jsEvent = getJSEventName(host, originalUri);
        try {
            put(Const.JsonKeys.EVENT, jsEvent);
        } catch (JSONException e) {
            Toast.makeText(appContext, Const.ToastMSG.JS_SET_EVENT_NAME_ERR + "\n" + e, Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Find event name based on the launching url
     * By default, event name from the host object will be used
     * But if we have some path entry in the host and it matches the one from the launch url - his event name will be used
     */
    private String getJSEventName(AppLinkHost host, Uri originalUri) {
        String jsEvent = host.getJsEvent();
        final String originPath = originalUri.getPath().toLowerCase();
        final List<AppLinkPath> hostPathsList = host.getPaths();
        for (AppLinkPath hostPath : hostPathsList) {
            final String hostPathUrl = hostPath.getPathURL();
            if (hostPathUrl == null) continue;
            if (originPath.matches(hostPathUrl)) {
                jsEvent = hostPath.getJsEvent();
                break;
            }
        }
        return jsEvent;
    }

    /**
     * Fill data block with corresponding information.
     */
    private void setMessageData(AppLinkHost host, Uri originalUri) {
        final JSONObject dataObject = new JSONObject();
        try {
            dataObject.put(Const.JsonKeys.ORIGIN, originalUri.toString());
            dataObject.put(Const.JsonKeys.HOST, host.getHostName());
            dataObject.put(Const.JsonKeys.SCHEME, host.getScheme());
            dataObject.put(Const.JsonKeys.HASH, originalUri.getFragment());
            dataObject.put(Const.JsonKeys.PATH, originalUri.getPath());
            dataObject.put(Const.JsonKeys.PARAMS, getQueryParamsFromUri(originalUri));
            put(Const.JsonKeys.DATA, dataObject);
        } catch (JSONException e) {
            Toast.makeText(appContext, Const.ToastMSG.JS_SET_EVENT_DATA_ERR + "\n" + e, Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Parse query params<br>
     * For example, if we have link like so: http://somedomain.com/some/path?foo=fooVal&bar=barVal , then
     * resulting object will be {foo: fooVal, bar: barVal}.
     * @return json A json
     */
    private JSONObject getQueryParamsFromUri(Uri originalUri) throws JSONException, UnsupportedOperationException {
        JSONObject queryParams = new JSONObject();
        for (String key : originalUri.getQueryParameterNames())
            queryParams.put(key, originalUri.getQueryParameter(key));
        return queryParams;
    }
}