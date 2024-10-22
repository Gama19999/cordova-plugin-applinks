package ovh.serial30.cordova.applinks.pojos;

import ovh.serial30.cordova.applinks.constants.Const;

import java.util.ArrayList;
import java.util.List;

/**
 * Model for <al-host /> entry specified in config.xml file
 * @author Gamaliel Rios
 */
public class AppLinkHost {
    private final String hostName;
    private final List<AppLinkPath> paths;
    private final String scheme;
    private String jsEvent;

     public AppLinkHost(final String hostName, final String scheme, final String jsEvent) {
        this.hostName = hostName.toLowerCase();
        this.scheme = (scheme == null) ? "http" : scheme;
        this.jsEvent = (jsEvent == null) ? Const.Events.DEFAULT_EVENT : jsEvent;
        this.paths = new ArrayList<AppLinkPath>();
    }

    public String getJsEvent() { return jsEvent; }

    public void setJsEvent(final String jsEvent) { this.jsEvent = jsEvent; }

    public List<AppLinkPath> getPaths() { return paths; }

    public String getHostName() { return hostName; }

    public String getScheme() { return scheme;}
}