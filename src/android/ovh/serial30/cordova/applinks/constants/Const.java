package ovh.serial30.cordova.applinks.constants;

/**
 * Class that stores plugin string constants
 * @author Gamaliel Rios
 */
public final class Const {
    public interface Actions {
        String SUBSCRIBE = "subscribe";
        String UNSUBSCRIBE = "unsubscribe";
    }
    public interface Events {
        String DEFAULT_EVENT = "launchedAppFromAppLink";
        String ON_EXTERNAL_BROWSER = "onExternalBrowser";
    }
    public interface JsonKeys {
        String EVENT = "event";
        String DATA = "data";
        String PATH = "path";
        String SCHEME = "scheme";
        String HOST = "host";
        String HASH = "hash";
        String PARAMS = "params";
        String ORIGIN = "url";
    }
    public interface XMLTags {
        String APPLINK_TAG = "applink";
        String AL_HOST_TAG = "al-host";
        String AL_HOST_NAME_ATTR = "name";
        String AL_HOST_SCHEME_ATTR = "scheme";
        String AL_HOST_EVENT_ATTR = "event";
        String AL_PATH_TAG = "al-path";
        String AL_PATH_URL_ATTR = "url";
        String AL_PATH_EVENT_ATTR = "event";
    }
    public interface ToastMSG {
        String APP_LAUNCH = "Start by app!";
        String URL_LAUNCH = "Start by url!";
        String UNKNOWN_HOST = "Start not supported from: ";
        String JS_GET_EVENT_NAME_ERR = "Failed to get JS EvName";
        String JS_SET_EVENT_NAME_ERR = "Failed to set JS EvName";
        String JS_SET_EVENT_DATA_ERR = "Failed to set JS Data";
        String JS_GET_EVENT_DATA_URL_ERR = "Failed to set JS Data";
    }
}