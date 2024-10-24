package ovh.serial30.cordova.applinks.services;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AppLinkDownloadReciver extends BroadcastReceiver {
    private Context appContext;
    private Intent serviceIntent;

    public AppLinkDownloadReciver(Context appContext, Intent serviceIntent) {
        this.appContext = appContext;
        this.serviceIntent = serviceIntent;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
            appContext.stopService(serviceIntent);
        }
    }
}