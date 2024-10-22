package ovh.serial30.cordova.applinks.parser;

import android.content.Context;
import android.text.TextUtils;

import org.apache.cordova.ConfigXmlParser;
import org.xmlpull.v1.XmlPullParser;
import ovh.serial30.cordova.applinks.pojos.AppLinkHost;
import ovh.serial30.cordova.applinks.pojos.AppLinkPath;
import ovh.serial30.cordova.applinks.constants.Const;

import java.util.ArrayList;
import java.util.List;

/**
 * Parser for config.xml file and reads only plugin-specific preferences
 * @author Gamaliel Rios
 */
public class AppLinkConfigXMLParser extends ConfigXmlParser {
    private final Context context;
    private List<AppLinkHost> hostsList;

    private boolean isInsideMainTag;
    private boolean didParseMainBlock;
    private boolean isInsideHostBlock;
    private AppLinkHost processedHost;

    /**
     * Constructor
     * @param context Application context
     */
    public AppLinkConfigXMLParser(Context context) { this.context = context; }

    /**
     * Parse config.xml
     * @return List of AppLinkHost defined in the config.xml file
     */
    public List<AppLinkHost> parse() {
        reset();
        super.parse(context);
        return hostsList;
    }

    private void reset() {
        hostsList = new ArrayList<AppLinkHost>();
        isInsideMainTag = false;
        didParseMainBlock = false;
        isInsideHostBlock = false;
        processedHost = null;
    }

    @Override
    public void handleStartTag(XmlPullParser xml) {
        if (didParseMainBlock) return;
        final String name = xml.getName();
        if (!isInsideMainTag && Const.XMLTags.APPLINK_TAG.equals(name)) {
            isInsideMainTag = true;
            return;
        }
        if (!isInsideMainTag) return;
        if (!isInsideHostBlock && Const.XMLTags.AL_HOST_TAG.equals(name)) {
            isInsideHostBlock = true;
            processHostBlock(xml);
            return;
        }
        if (isInsideHostBlock && Const.XMLTags.AL_PATH_TAG.equals(name)) processPathBlock(xml);
    }

    /**
     * Parse <al-host /> tag from config.xml file
     */
    private void processHostBlock(XmlPullParser xml) {
        final String hostName = xml.getAttributeValue(null, Const.XMLTags.AL_HOST_NAME_ATTR);
        final String jsEventName = xml.getAttributeValue(null, Const.XMLTags.AL_HOST_EVENT_ATTR);
        final String scheme = xml.getAttributeValue(null, Const.XMLTags.AL_HOST_SCHEME_ATTR);
        processedHost = new AppLinkHost(hostName, scheme, jsEventName);
    }

    /**
     * Parse <al-path /> tag from config.xml file
     */
    private void processPathBlock(XmlPullParser xml) {
        final String pathUrl = xml.getAttributeValue(null, Const.XMLTags.AL_PATH_URL_ATTR);
        String jsEventName = xml.getAttributeValue(null, Const.XMLTags.AL_PATH_EVENT_ATTR);
        // Skip wildcard urls
        if ("*".equals(pathUrl) || ".*".equals(pathUrl)) {
            if (!TextUtils.isEmpty(jsEventName)) processedHost.setJsEvent(jsEventName); // If path has jsEventName then set it to host
            return;
        }
        // If jsEventName is empty then use one from the host
        if (TextUtils.isEmpty(jsEventName)) jsEventName = processedHost.getJsEvent();
        // Create path entry
        AppLinkPath path = new AppLinkPath(pathUrl, jsEventName);
        processedHost.getPaths().add(path);
    }

    @Override
    public void handleEndTag(XmlPullParser xml) {
        if (didParseMainBlock) return;
        final String name = xml.getName();
        if (isInsideHostBlock && Const.XMLTags.AL_HOST_TAG.equals(name)) {
            isInsideHostBlock = false;
            hostsList.add(processedHost);
            processedHost = null;
            return;
        }
        if (Const.XMLTags.APPLINK_TAG.equals(name)) {
            isInsideMainTag = false;
            didParseMainBlock = true;
        }
    }
}