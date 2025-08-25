import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text as UIText } from '@/components/ui/text';

type VideoInfo = {
  uri: string;
  name: string;
  size: number;
  duration: number;
};

type SplitProgress = {
  current: number;
  total: number;
  percentage: number;
  isProcessing: boolean;
};

export default function SplitVideoScreen() {
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [segmentDuration, setSegmentDuration] = useState('60');
  const [splitProgress, setSplitProgress] = useState<SplitProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    isProcessing: false,
  });
  const [splitResults, setSplitResults] = useState<string[]>([]);

  // 創建影片播放器
  const videoPlayer = useVideoPlayer(selectedVideo?.uri || null, (player) => {
    if (player) {
      player.loop = false;
      player.volume = 1.0;
    }
  });

  // 請求權限
  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        // 檢查 Android 版本，Android 13+ 使用新的權限
        const androidVersion = Platform.Version;

        let storagePermission;
        if (androidVersion >= 33) {
          // Android 13+ 使用 READ_MEDIA_VIDEO
          // 先檢查權限是否已經被授予
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          );

          if (hasPermission) {
            storagePermission = PermissionsAndroid.RESULTS.GRANTED;
          } else {
            storagePermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
              {
                title: '媒體權限',
                message: '需要媒體權限來存取影片檔案',
                buttonNeutral: '稍後詢問',
                buttonNegative: '取消',
                buttonPositive: '確定',
              }
            );
          }
        } else {
          // Android 12 及以下使用 WRITE_EXTERNAL_STORAGE
          // 先檢查權限是否已經被授予
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );

          if (hasPermission) {
            storagePermission = PermissionsAndroid.RESULTS.GRANTED;
          } else {
            storagePermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: '儲存權限',
                message: '需要儲存權限來儲存分割後的影片',
                buttonNeutral: '稍後詢問',
                buttonNegative: '取消',
                buttonPositive: '確定',
              }
            );
          }
        }

        if (storagePermission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            '權限被永久拒絕',
            '請在設定中手動開啟儲存權限，或重新安裝應用程式',
            [
              { text: '取消', style: 'cancel' },
              { text: '前往設定', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }

        if (storagePermission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('權限被拒絕', '需要儲存權限來繼續操作');
          return false;
        }
      }

      const mediaPermission = await MediaLibrary.requestPermissionsAsync();

      if (!mediaPermission.granted) {
        if (mediaPermission.canAskAgain === false) {
          Alert.alert(
            '媒體庫權限被永久拒絕',
            '請在設定中手動開啟媒體庫權限，或重新安裝應用程式',
            [
              { text: '取消', style: 'cancel' },
              { text: '前往設定', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert('權限被拒絕', '需要媒體庫權限來儲存影片');
        }
        return false;
      }

      return true;
    } catch (_error) {
      Alert.alert('錯誤', '權限請求時發生錯誤');
      return false;
    }
  }, []);

  // 選擇影片
  const pickVideo = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      // 清空暫存資料夾
      try {
        const baseDir = FileSystem.documentDirectory + 'split-videos/';
        const dirInfo = await FileSystem.getInfoAsync(baseDir);

        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(baseDir);

          // 刪除所有暫存檔案
          for (const file of files) {
            const filePath = `${baseDir}${file}`;
            try {
              await FileSystem.deleteAsync(filePath);
            } catch (deleteError) {
              console.warn('刪除檔案失敗:', filePath, deleteError);
            }
          }

          // 重新創建目錄（確保目錄存在）
          await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
        }
      } catch (cleanupError) {
        console.warn('清空暫存資料夾時發生錯誤:', cleanupError);
        // 不阻擋影片選擇流程，繼續執行
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 0,
        allowsMultipleSelection: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (asset) {
        if (!asset.uri) {
          console.error('錯誤：影片 URI 為空');
          Alert.alert('錯誤', '無法獲取影片路徑，請重試');
          return;
        }

        // 檢查檔案是否存在
        try {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);

          if (!fileInfo.exists) {
            console.error('錯誤：檔案不存在於路徑:', asset.uri);
            Alert.alert('錯誤', '選擇的影片檔案不存在，請重試');
            return;
          }
        } catch (fileError) {
          console.error('檢查檔案時發生錯誤:', fileError);
        }

        setSelectedVideo({
          uri: asset.uri,
          name: asset.fileName || 'unknown',
          size: asset.fileSize || 0,
          duration: asset.duration || 0,
        });
        setSplitResults([]);
      } else {
        console.error('錯誤：沒有選擇到任何資源');
        Alert.alert('錯誤', '沒有選擇到影片，請重試');
      }
    } catch (error) {
      console.error('選擇影片時發生錯誤:', error);
      console.error('錯誤詳情:', JSON.stringify(error, null, 2));
      Alert.alert('錯誤', '選擇影片時發生錯誤，請查看控制台日誌');
    }
  }, [requestPermissions]);

  // 分割影片
  const splitVideo = useCallback(async () => {
    if (!selectedVideo) {
      Alert.alert('錯誤', '請先選擇影片');
      return;
    }

    const duration = parseInt(segmentDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('錯誤', '請輸入有效的分割時長');
      return;
    }

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // 創建輸出目錄
      const baseDir = FileSystem.documentDirectory + 'split-videos/';
      const dirInfo = await FileSystem.getInfoAsync(baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
      }

      setSplitProgress((prev) => ({ ...prev, isProcessing: true }));

      // 使用 FFmpeg 分割影片
      // 只複製必要的音訊和影片資料流，忽略 metadata 資料流
      const outputPattern = `${baseDir}segment_%03d.mp4`;
      const command = `-i "${selectedVideo.uri}" -map 0:v -map 0:a -c copy -segment_time ${duration} -f segment -reset_timestamps 1 "${outputPattern}"`;

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        // 獲取分割後的檔案列表
        const files = await FileSystem.readDirectoryAsync(baseDir);
        const videoFiles = files.filter((file) => file.endsWith('.mp4'));

        setSplitResults(videoFiles.map((file) => `${baseDir}${file}`));
        setSplitProgress((prev) => ({ ...prev, isProcessing: false }));

        Alert.alert('成功', `影片已成功分割成 ${videoFiles.length} 個片段`);
      } else {
        const logs = await session.getLogsAsString();
        console.error('FFmpeg 執行失敗，返回碼:', returnCode);
        console.error('FFmpeg 錯誤日誌:', logs);
        Alert.alert('錯誤', '影片分割失敗，請檢查影片格式');
        setSplitProgress((prev) => ({ ...prev, isProcessing: false }));
      }
    } catch (error) {
      console.error('分割影片時發生錯誤:', error);
      Alert.alert('錯誤', '分割影片時發生錯誤');
      setSplitProgress((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [selectedVideo, segmentDuration, requestPermissions]);

  // 儲存到相簿
  const saveToGallery = useCallback(async (filePath: string) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(filePath);
      await MediaLibrary.createAlbumAsync('Split Videos', asset, false);
      Alert.alert('成功', '影片已儲存到相簿');
    } catch (error) {
      console.error('儲存到相簿時發生錯誤:', error);
      Alert.alert('錯誤', '儲存到相簿失敗');
    }
  }, []);

  // 清除結果
  const clearResults = useCallback(async () => {
    try {
      // 清空暫存資料夾
      const baseDir = FileSystem.documentDirectory + 'split-videos/';
      const dirInfo = await FileSystem.getInfoAsync(baseDir);

      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(baseDir);

        // 刪除所有暫存檔案
        for (const file of files) {
          const filePath = `${baseDir}${file}`;
          try {
            await FileSystem.deleteAsync(filePath);
          } catch (deleteError) {
            console.warn('刪除檔案失敗:', filePath, deleteError);
          }
        }
      }
    } catch (cleanupError) {
      console.warn('清除暫存資料夾時發生錯誤:', cleanupError);
    }

    setSplitResults([]);
    setSelectedVideo(null);
    setSplitProgress({
      current: 0,
      total: 0,
      percentage: 0,
      isProcessing: false,
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <UIText className="mb-2 text-2xl font-bold text-black dark:text-white">
            影片分割工具
          </UIText>
          <UIText className="text-base text-neutral-600 dark:text-neutral-400">
            選擇影片並分割成指定時長的片段
          </UIText>
        </View>

        {/* 影片選擇區域 */}
        <View className="mb-6">
          <UIText className="mb-3 text-lg font-semibold text-black dark:text-white">
            選擇影片
          </UIText>

          {selectedVideo ? (
            <View className="mb-3 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
              {/* 影片播放器預覽 */}
              <View className="mb-3 overflow-hidden rounded-lg">
                <VideoView
                  player={videoPlayer}
                  style={{ width: '100%', height: 200 }}
                  allowsFullscreen
                />
              </View>

              <UIText className="font-medium text-black dark:text-white">
                已選擇: {selectedVideo.name}
              </UIText>
              <UIText className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                大小: {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
              </UIText>
              <UIText className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                總時長: {Math.floor(selectedVideo.duration / 60000)}:
                {((selectedVideo.duration % 60000) / 1000)
                  .toFixed(0)
                  .toString()
                  .padStart(2, '0')}
              </UIText>
            </View>
          ) : (
            <View className="items-center rounded-lg border-2 border-dashed border-neutral-300 p-8 dark:border-neutral-600">
              <UIText className="mb-2 text-center text-neutral-500 dark:text-neutral-400">
                點擊從相簿選擇影片
              </UIText>
              <UIText className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                支援 MP4, MOV, AVI 等格式
              </UIText>
            </View>
          )}

          <Button
            label={selectedVideo ? '重新選擇影片' : '選擇影片'}
            variant={selectedVideo ? 'outline' : 'default'}
            onPress={pickVideo}
            className="mt-3"
          />
        </View>

        {/* 分割設定 */}
        <View className="mb-6">
          <UIText className="mb-3 text-lg font-semibold text-black dark:text-white">
            分割設定
          </UIText>

          <Input
            label="分割時長（秒）"
            value={segmentDuration}
            onChangeText={setSegmentDuration}
            keyboardType="numeric"
            placeholder="60"
            className="mb-3 text-white"
          />

          <UIText className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
            建議設定為 60 秒（1分鐘）
          </UIText>
        </View>

        {/* 操作按鈕 */}
        <View className="mb-6">
          <Button
            label="開始分割"
            onPress={splitVideo}
            loading={splitProgress.isProcessing}
            disabled={!selectedVideo || splitProgress.isProcessing}
            className="mb-3"
          />

          {splitResults.length > 0 && (
            <Button label="清除結果" variant="outline" onPress={clearResults} />
          )}
        </View>

        {/* 進度顯示 */}
        {splitProgress.isProcessing && (
          <View className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <UIText className="mb-2 font-medium text-blue-800 dark:text-blue-200">
              正在處理中...
            </UIText>
            <View className="h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800">
              <View
                className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                style={{ width: `${splitProgress.percentage}%` }}
              />
            </View>
          </View>
        )}

        {/* 分割結果 */}
        {splitResults.length > 0 && (
          <View className="mb-6">
            <UIText className="mb-3 text-lg font-semibold text-black dark:text-white">
              分割結果 ({splitResults.length} 個片段)
            </UIText>

            {splitResults.map((filePath, index) => (
              <View
                key={index}
                className="mb-2 flex-row items-center justify-between rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800"
              >
                <View className="flex-1">
                  <UIText className="font-medium text-black dark:text-white">
                    片段 {index + 1}
                  </UIText>
                  <UIText className="text-sm text-neutral-600 dark:text-neutral-400">
                    {filePath.split('/').pop()}
                  </UIText>
                </View>

                <Button
                  label="儲存"
                  variant="secondary"
                  size="sm"
                  onPress={() => saveToGallery(filePath)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
