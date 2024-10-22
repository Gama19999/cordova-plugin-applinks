package ovh.serial30.cordova.applinks.pojos;

/**
 * Model for <al-path /> entry for <al-host /> in config.xml file
 * @author Gamaliel Rios
 */
public class AppLinkPath {
    private final String pathURL;
    private final String jsEvent;

    public DeepLinkPath(final String pathURL, final String jsEvent) {
        this.pathURL = pathURL.replace("*", "(.*)").toLowerCase();
        this.jsEvent = jsEvent;
    }

    public String getPathURL() { return pathURL; }

    public String getJsEvent() { return jsEvent; }
}