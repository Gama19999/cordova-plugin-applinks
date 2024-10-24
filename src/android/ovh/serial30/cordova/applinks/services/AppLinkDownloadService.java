package ovh.serial30.cordova.applinks.services;

import android.app.DownloadManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Binder;
import android.os.Environment;
import android.os.IBinder;
import android.widget.Toast;

import ovh.serial30.cordova.applinks.constants.Const;

/**
 * Android download service
 * Stores the logic to download a file from the given URL and stores it on the device Downloads folder
 * @author Gamaliel Rios
 */
public class AppLinkDownloadService extends Service {
    public boolean isServiceRunning;
    public boolean isDownloading;

    public class AppLinkDownloadServiceBinder extends Binder {
        public AppLinkDownloadService getService() {
            return AppLinkDownloadService.this;
        }
    }

    @Override
    public IBinder onBind (Intent intent) {
        return new AppLinkDownloadServiceBinder();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        isServiceRunning = true;
        isDownloading = false;
        Toast.makeText(this, Const.ToastMSG.DOWNLOAD_SERIVCE_CREATED, Toast.LENGTH_SHORT).show();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (isServiceRunning && !isDownloading) {
            isDownloading = true;
            downloadFile(intent.getData());
        }
        return START_NOT_STICKY; // We want this service to continue running until it is explicitly stopped, so return 
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isDownloading = false;
        isServiceRunning = true;
        Toast.makeText(this, Const.ToastMSG.DOWNLOAD_COMPLETED, Toast.LENGTH_SHORT).show();
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
        Toast.makeText(this, Const.ToastMSG.DOWNLOAD_START, Toast.LENGTH_SHORT).show();
        DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        downloadManager.enqueue(request);
    }
}