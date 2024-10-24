package ovh.serial30.cordova.applinks.services;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AppLinkDownloadReciver extends BroadcastReceiver {
    private Context appConext;
    private Intent serviceIntent;

    public DownloadReciver(Context appContext, Intent serviceIntent) {
        this.appConext = appConext;
        this.serviceIntent = serviceIntent;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
            appConext.stopService(serviceIntent);
        }
    }
}