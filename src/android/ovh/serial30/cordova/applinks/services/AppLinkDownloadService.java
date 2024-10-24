package ovh.serial30.cordova.applinks.services;

import android.app.DownloadManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Environment;
import android.widget.Toast;

/**
 * Android download service
 * Stores the logic to download a file from the given URL and stores it on the device Downloads folder
 * @author Gamaliel Rios
 */
public class AppLinkDownloadService extends Service {

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Toast.makeText(this, Const.ToastMSG.DOWNLOAD_START, Toast.LENGTH_SHORT).show();
        downloadFile(intent.getData());
        return START_STICKY; // We want this service to continue running until it is explicitly stopped, so return 
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    /**
     * Logic to download the file to device Downloads folder
     * @param url URL to make the download request
     */
    private void downloadFile(Uri url) {
        DownloadManager.Request request = new DownloadManager.Request(url);
        String fileName = url.getPathSegments().get(url.getPathSegments().size() - 1);
        request.setTitle("File: " + fileName);
        request.setDescription("Inn-App download...");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
        DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        downloadManager.enqueue(request);
        registerReceiver(new DonwloadCompleteReceiver(), new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
    }

    /**
     * Custom class that receives and handles intents of complete downloads
     */
    private class DonwloadCompleteReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if(DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
                Toast.makeText(context, Const.ToastMSG.DOWNLOAD_COMPLETED, Toast.LENGTH_SHORT).show();
                AppLinkDownloadService.this.stopSelf();
            }
        }
    }
}