# Cordova AppLinks Plugin (v1.2.0)

**NOTE:** This is a fork from the cordova plugin "cordova-plugin-deeplinks" which is a fork from the original cordova plugin "cordova-deeplinks" that in turn is a fork from "cordova-universal-links-plugin"

This Cordova plugin adds support for opening an application from the browser when user clicks on the link, better known as:
- [Universal Links on iOS](https://developer.apple.com/library/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html)
- [Deep Linking on Android](https://developer.android.com/training/app-indexing/deep-linking.html)
to implement fucntionality so you can have a single link that will either open your app or your website, if the app isn't installed.



## Usage process

1. Add the plugin to your project (see [Installation](#installation)).
2. Define supported hosts and paths in Cordova's `config.xml` (see [Cordova AppLinks preferences](#cordova-applinks-preferences)).
3. Write some JavaScript code to listen for application launch by the links (see [JS integration to handle application launch](#js-integration-to-handle-application-launch)).
4. Build project from the CLI.
5. Activate support for AppLinks on your website (see [Android web integration](#android-web-integration)).
6. Test it (see [Test UL for Android locally](#testing-ul-for-android-locally) and [Testing iOS application](#testing-ios-application)).

It is important not only to redirect users to your app from the web, but also provide them with the information they were looking for. For example, if someone clicks on `http://mysite.com/news` and get redirected in the app - they are probably hoping to see the `news` page in it. The plugin will help developers with that. In `config.xml` you can specify an event name that is dispatched when user opens the app from the certain link. This way, the appropriate method of your web project will be called, and you can show to user the requested content.

**Note:** This is only a fork of the Cordova Universal Links Plugin, if you have any questions or issues please refer to https://github.com/nordnet/cordova-universal-links-plugin.



## Supported Platforms

- Android 4.0.0 or above.
- ~~iOS 9.0 or above.~~

> [!NOTE]
> iOS platform functionality is under development. Not ready to use.



## Documentation
- [Installation](#installation)
- [Cordova AppLinks preferences](#cordova-applinks-preferences)
  - [Event onExternalBrowser](#event-onexternalbrowser)
- [Prevent Android from creating multiple app instances](#prevent-android-from-creating-multiple-app-instances)
- [JS integration to handle application launch](#js-integration-to-handle-application-launch)
- [Usage examples](#usage-examples)
- [Android web integration](#android-web-integration)
  - [Modify web pages](#modify-web-pages)
  - [Digital Asset Links support](#digital-asset-links-support)
- [Testing AppLinks for Android locally](#testing-applinks-for-android-locally)
- [Additional documentation links](#additional-documentation-links)



### Installation
Install via repo url directly

```sh
cordova plugin add https://github.com/Gama19999/cordova-plugin-applinks
```



### Cordova AppLinks preferences

Cordova uses `config.xml` file to set different project preferences: name, description, starting page and so on. Using this config file you can also set options for the plugin.

### `<applink />` tag

Those preferences are specified inside the `<applink>` block. For example:

```xml
<applink>
    <al-host name="example.com">
        <al-path url="/some/path" />
    </al-host>
</applink>
```

In it you define hosts and paths that application should handle. You can have as many hosts and paths as you like.

### `<al-host />` tag
The tag `<al-host />` lets you describe hosts, that your application supports. It can have three attributes:
- `name` - hostname. **This is a required attribute.**
- `scheme` - supported url scheme. Should be either `http` or `https`. If not set - `http` is used.
- `event` - name of the JS event, that is used to match application launch from this host to a callback on the JS side. If not set - pass `null` as event name when you are subscribing in JS code.

For example, the following code:

```xml
<applink>
    <al-host name="example.com" scheme="https" event="customJSEventName" />
</applink>
```

defines, that when user clicks on any `https://example.com` link, the JS callback that was set for `customJSEventName` gets called. More details regarding event handling can be found [below](#application-launch-handling).

You can also use wildcards for domains, as example the following code:

```xml
<applink>
    <al-host name="*.users.example.com" scheme="https" event="wildcardusers" />
    <al-host name="*.example.com" scheme="https" event="wildcardmatch" />
</applink>
```

Android will try to access the [app links file](https://developer.android.com/training/app-links/index.html#web-assoc) at `https://*.users.example.com/.well-known/assetlinks.json` and `https://*.example.com/.well-known/assetlinks.json` respectively.

### `<al-path />` tag
With the use of `<al-path />` tag, you define which paths for the given `<al-host />` you want to support. If no `<al-path />` is set - then we want to handle all of them. If paths are defined - then application will process only those links.

Supported attributes are:
- `url` - path component of the url; should be relative to the host name. **This is a required attribute.**
- `event` - name of the JS event, that is used to match application launch from the given hostname and path to a callback on the JS side. If not set - pass `null` as event name when you are subscribing in JS code.

For example, the following code:

```xml
<applink>
    <al-host name="example.com">
        <al-path url="/some/path" />
    </al-host>
</applink>
```

defines, that when user clicks on `http://example.com/some/path` - application will be launched, and default JS callback gets called. All other links from that host will be ignored.

**Note:** Query parameters are not used for link matching. For example, `http://example.com/some/path?foo=bar#some_tag` will work the same way as `http://example.com/some/path` does.

In order to support all links inside `/some/path/` you can use the wildcard character `*` like so:

```xml
<applink>
    <al-host name="example.com">
        <al-path url="/some/path/*" />
    </al-host>
</applink>
```

**Note:** The wildcard character: `*` can be used only for paths, but you can place it anywhere, as example the following code:

```xml
<applink>
    <al-host name="example.com">
        <al-path url="*mypath*" />
    </al-host>
</applink>
```

states, that application can handle any link from `http://example.com` which has `mypath` string in his path component: `http://example.com/some/long/mypath/test.html`, `http://example.com/testmypath.html` and so on.

### All hostname paths configuration

To handle all paths under a given hostname use the following configuration:

```xml
<applink>
    <al-host name="example.com" />
</applink>
```

**Note:** Above code configuration is the same as the following:

```xml
<applink>
    <al-host name="example.com">
      <al-path url="*" />
    </al-host>
</applinks>
```



### Event onExternalBrowser

If you need to open a link on an external browser from inside your app use the custom JS event `onExternalBrowser` to make the plugin launch a new Android `Intent` to try to visit the URL the external browser.

[!TIP]
> This may be useful to **download** files with an in-app link directly from a website.

To achieve this in the `config.xml` file specify the `onExternalBrowser` **event** attribute on the `<al-path />` tag, here is the example:

```xml
<applink>
    <al-host name="example.com">
      <al-path url="/path/to/open/on/external/browser" event="onExternalBrowser" />
    </al-host>
</applinks>
```

Then in your `www/js/index.js` file add call the `subscribe` plugin method and bind the `onExternalBrowser` JS event, here is the example:
```js
window.plugins.AppLinks.subscribe('onExternalBrowser', function (eventData) {
  // do some work
  console.log('Trying to open in external browser the URL: ' + eventData.url);
});
```



### Prevent Android from creating multiple app instances

When clicking on a universal link from another App (typically from an email client), Android will likely create a new instance of your app, even if it is already loaded in memory. It may even create a new instance with each click, resulting in many instances of your app in the task switcher. See details in [issue #37](https://github.com/nordnet/cordova-universal-links-plugin/issues/37).

To force Android opening always the same app instance, a known workaround is to change the [activity launch mode](https://developer.android.com/guide/topics/manifest/activity-element.html#lmode) to `singleInstance`. To do so, you can use the following preference in Cordova `config.xml` file:
```xml
<preference name="AndroidLaunchMode" value="singleInstance" />
```



### JS integration to handle application launch 

As mentioned, it is not enough just to redirect a user into your app, you will also need to display the correct content. In order to solve that, the plugin provides the JavaScript module `AppLinks` served through the `window.plugins` JS property. 

### `subscribe` plugin method 

To get notified on application launch implement the followin code on your JS file:
```js
window.plugins.AppLinks.subscribe('customJSEventName', function (eventData) {
  // do some work
  console.log('Did launch application from the link: ' + eventData.url);
});
```

If you didn't specify event name for path and host in `config.xml` - just pass `null` as a first parameter:
```js
window.plugins.AppLinks.subscribe(null, function (eventData) {
  // do some work
  console.log('Did launch application from the link: ' + eventData.url);
});
```

### `eventData` argument

The argument passed to callback function `eventData`, holds information about the launching url. For example, for `http://myhost.com/news/ul-plugin-released.html?foo=bar#cordova-news` it will be:

```json
{
  "url": "http://myhost.com/news/ul-plugin-released.html?foo=bar#cordova-news",
  "scheme": "http",
  "host": "myhost.com",
  "path": "/news/ul-plugin-released.html",
  "params": {
    "foo": "bar"
  },
  "hash": "cordova-news"
}
```

- `url` - original launch url
- `scheme` - url scheme
- `host` - hostname from the url
- `path` - path component of the url
- `params` - dictionary with query parameters, which are the ones that after `?` character in the URL
- `hash` - content after `#` character

### `unsubscribe` plugin method

If you want - you can also unsubscribe from the events later on:
```js
window.plugins.AppLinks.unsubscribe('eventName');
```



### Usage examples
Now it's time for some examples. In here we are gonna use Android, because it is easier to test (see [testing for Android](#testing-ul-for-android-locally) section). JavaScript side is platform independent, so all the example code below will also work for iOS.

1. Create new Cordova application and add Android platform.

  ```sh
  cordova create TestAndroidApp com.example.applinks TestAndroidApp
  cd ./TestAndroidApp
  cordova platform add android
  ```

2. Add AppLinks plugin:

  ```sh
  cordova plugin add https://github.com/Gama19999/cordova-plugin-applinks.git
  ```

3. Add `<applink>` preference into `config.xml`:

  ```xml
  <!-- some other data from config.xml -->
  <applink>
   <al-host name="myhost.com">
     <al-path url="/news/" event="openNewsListPage" />
     <al-path url="/news/*" event="openNewsDetailedPage" />
   </al-host>
  </applink>
  ```

  - As you can see, we want our application to be launched when user goes to the `news` section of our website and for that we are gonna dispatch different events to understand, what has happened.

4. Subscribe to `openNewsListPage` and `openNewsDetailedPage` events. For that open `www/js/index.js` and make it look like that:

  ```js
  const app = {
    // Application Constructor
    initialize: function() {
      this.bindEvents();
    },

    // Bind Event Listeners
    bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    onDeviceReady: function() {
      console.log('Device is ready for work');
      window.plugins.AppLinks.subscribe('openNewsListPage', app.onNewsListPageRequested);
      window.plugins.AppLinks.subscribe('openNewsDetailedPage', app.onNewsDetailedPageRequested);
    },

    // openNewsListPage Event Handler
    onNewsListPageRequested: function(eventData) {
      console.log('Showing list of awesome news.');

      // do some work to show list of news
    },

    // openNewsDetailedPage Event Handler
    onNewsDetailedPageRequested: function(eventData) {
      console.log('Showing to user details page: ' + eventData.path);

      // do some work to show detailed page
    }
  };

  app.initialize();
  ```

  - Now, if the user clicks on a `http://myhost.com/news/` link, the JS method `onNewsListPageRequested` will be called, and for every link clicked that follows something like `http://myhost.com/news/*`, the `onNewsDetailedPageRequested` JS method will be executed.
  - This creates a mapping between the links and JavaScript methods.

5. Build and run your application:

  ```sh
  cordova run android
  ```

6. Close your app.<br><br>

7. Execute in the terminal:

  ```sh
  adb shell am start -W -a android.intent.action.VIEW -d "http://myhost.com/news/" com.example.applinks
  ```

  - As a result, your application will be launched, and in JavaScript console you will see the message:

  ```
  Showing to user list of awesome news.
  ```

  - Repeat operation, but this time with the command:

  ```sh
  adb shell am start -W -a android.intent.action.VIEW -d "http://myhost.com/news/ul-plugin-released.html" com.example.applinks
  ```

  - Application will be launched and you will see in JS console:

  ```
  Showing to user details page: /news/ul-plugin-released.html
  ```

- Now, let's say, you want your app to handle all links from `myhost.com`, but you need to keep the mapping for the paths. For that you just need to modify your `config.xml` and add default event handler on JavaScript side:

1. Open `config.xml` and change the `<applink>` block like so:

  ```xml
  <applink>
   <al-host name="myhost.com">
     <al-path url="/news/" event="openNewsListPage" />
     <al-path url="/news/*" event="openNewsDetailedPage" />
     <al-path url="*" event="launchedAppFromLink" />
   </al-host>
  </applink>
  ```

  - As you can see, we added `*` as a `path`. This way we declared, that application should be launched from any `http://myhost.com` link.

2. Add handling for default AppLink event in the `www/js/index.js`:

  ```js
  const app = {
    // Application Constructor
    initialize: function() {
      this.bindEvents();
    },

    // Bind Event Listeners
    bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    onDeviceReady: function() {
      console.log('Handle deviceready event if you need');
      window.plugins.AppLinks.subscribe('openNewsListPage', app.onNewsListPageRequested);
      window.plugins.AppLinks.subscribe('openNewsDetailedPage', app.onNewsDetailedPageRequested);
      window.plugins.AppLinks.subscribe('launchedAppFromLink', app.onApplicationDidLaunchFromLink);
    },

    // openNewsListPage Event Handler
    onNewsListPageRequested: function(eventData) {
      console.log('Showing to user list of awesome news');

      // do some work to show list of news
    },

    // openNewsDetailedPage Event Handler
    onNewsDetailedPageRequested: function(eventData) {
      console.log('Showing to user details page for some news');

      // do some work to show detailed page
    },

    // launchedAppFromLink Event Handler
    onApplicationDidLaunchFromLink: function(eventData) {
      console.log('Did launch app from the link: ' + eventData.url);
    }
  };

  app.initialize();
  ```

- That's it! Now, by default for `myhost.com` links, `onApplicationDidLaunchFromLink` JS method will be called, but for `news` section, `onNewsListPageRequested` and `onNewsDetailedPageRequested` will execute respectively.



### Android web integration

If you have already tried to use `adb` to simulate application launch from the link, you probably saw chooser dialog with at least two applications in it: browser and your app. This happens because web content can be handled by multiple things. To prevent this from happening you need to activate app indexing. App indexing is the second part of deep linking, where you link that URI/URL between Google and your app.

Integration process consists of three steps:

1. Modify your web pages by adding special `<link />` tags in the `<head />` section.
2. Verify your website on Webmaster Tools.
3. Connect your app in the Google Play console.




### Modify web pages

To create a link between your mobile content and the page on the website you need to include proper `<link />` tags in the `<head />` section of your website.

Link tag is constructed like so:

```html
<link rel="alternate" href="android-app://<package_name>/<scheme>/<host><path>" />
```

where:
- `<package_name>` - your application's package name
- `<scheme>` - url scheme
- `<host>` - hostname
- `<path>` - path component

For example, if your `config.xml` file looks like this:

```xml
<applink>
 <al-host name="myhost.com">
   <al-path url="/news/" />
   <al-path url="/profile/" />
 </al-host>
</applink>
```

and the package name of your application is `com.example.applinks`, then `<head />` section on your website will be:

```html
<head>
   <link rel="alternate" href="android-app://com.example.applinks/http/myhost.com/news/" />
   <link rel="alternate" href="android-app://com.example.applinks/http/myhost.com/profile/" />
   <!-- Your other stuff from the head tag -->
</head>
```

Good news is that this **plugin generates those tags for you**. When you run `cordova build` (or `cordova run`) they are placed in `al_web_hooks/android/android_web_hook.html` file inside your Cordova project root directory.

So, instead of manually writing them down you can take them from that file and put on the website.


### Digital Asset Links support

For Android version 6.0 (Marshmallow) or greater [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started) can be used.

Here's a very simplified example of how the website `www.example.com` could use Digital Asset Links to specify that any links to URLs in that site should open in a designated app rather than the browser:

1. The website `www.example.com` publishes a statement list at `https://www.example.com/.well-known/assetlinks.json`. This is the official name and location for a statement list on a site. Statement lists in any other location, or with any other name, are not valid for this site. In our example, the statement list consists of one statement, granting its Android app the permission to open links on its site:

  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target" : { "namespace": "android_app", "package_name": "com.example.app",
                 "sha256_cert_fingerprints": ["hash_of_app_certificate"] }
  }]
  ```

  - A statement list supports an array of statements within the [ ] marks, but our example file contains only one statement.

2. The Android app listed in the statement above has an intent filter that specifies the scheme, host, and path pattern of URLs that it wants to handle: in this case, `https://www.example.com`. The intent filter includes a special attribute `android:autoVerify`, new to Android M, which indicates that Android should verify the statement on the website, described in the intent filter when the app is installed.

3. A user installs the app. Android sees the intent filter with the `autoVerify` attribute and checks for the presence of the statement list at the specified site. If present, Android checks whether that file includes a statement granting link handling to the app, and verifies the app against the statement by certificate hash. If everything checks out, Android will then forward any `https://www.example.com` intents to the `example.com` app.

4. The user clicks a link to `https://www.example.com/puppies` on the device. This link could be anywhere: in a browser, in a Google Search Appliance suggestion, or anywhere else. Android forwards the intent to the `example.com` app.

5. The `example.com` app receives the intent and chooses to handle it, opening the puppies page in the app. If for some reason the app had declined to handle the link, or if the app were not on the device, then the link will be send to the next default intent handler, matching that intent pattern (i.e. browser).

### Testing AppLinks for Android locally

To test Android application for Deep Linking support you just need to execute the following command in the console:

```sh
adb shell am start -W -a android.intent.action.VIEW -d <URI> <PACKAGE>
```

where
- `<URI>` - url that you want to test;
- `<PACKAGE>` - your application's package name.

**Note:** if you didn't configure your website for AppLinks support then most likely after executing the `adb` command you will see a chooser dialog with multiple applications (at least browser and your test app). This happens because you are trying to view web content, and this can be handled by several applications. Just choose your app and proceed. If you configured your website as [described above](#android-web-integration) - then no dialog is shown and your application will be launched directly.

Let's create new application to play with:
1. Create new Cordova project and add Android platform to it:

  ```sh
  cordova create TestAndroidApp com.example.applinks TestAndroidApp
  cd ./TestAndroidApp
  cordova platform add android
  ```

2. Add AppLinks plugin:

  ```sh
  cordova plugin add https://github.com/Gama19999/cordova-plugin-applinks.git
  ```

3. Add `<applink>` preference into `config.xml` (`TestAndroidApp/config.xml`):

  ```xml
  <!-- some other data from config.xml -->
  <applink>
    <al-host name="myhost.com" />
  </applink>
  ```

4. Build and run the app:

  ```sh
  cordova run android
  ```

5. Close your application and return to console.<br><br>
6. Enter in console:

  ```sh
  adb shell am start -W -a android.intent.action.VIEW -d "http://myhost.com/any/path" com.example.applinks
  ```

  - As a result, your application will be launched and you will see in console:

  ```
  Starting: Intent { act=android.intent.action.VIEW dat=http://myhost.com/any/path pkg=com.example.applinks }
  Status: ok
  Activity: com.example.applinks/.MainActivity
  ThisTime: 52
  TotalTime: 52
  Complete
  ```

  - If you'll try to use host (or path), that is not defined in `config.xml` - you'll get a following error:

  ```
  Starting: Intent { act=android.intent.action.VIEW dat=http://anotherhost.com/path pkg=com.example.applinks }
  Error: Activity not started, unable to resolve Intent { act=android.intent.action.VIEW dat=http://anotherhost.com/path flg=0x10000000 pkg=com.example.applinks }
  ```

- This way you can experiment with your Android application and check how it corresponds to different links.



### Additional documentation links

**Android:** [Enable Deep Linking on Android](https://developer.android.com/training/app-links/deep-linking)

