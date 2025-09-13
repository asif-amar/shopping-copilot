import { useState, useEffect, useCallback } from 'react';
import { VersionInfo } from '@/types/storage';

interface UseChangelogReturn {
  hasUnreadChangelog: boolean;
  currentVersion: string;
  markChangelogAsRead: () => Promise<void>;
  getVersionInfo: () => Promise<VersionInfo | null>;
}

export const useChangelog = (): UseChangelogReturn => {
  const [hasUnreadChangelog, setHasUnreadChangelog] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('1.0.0');

  // Get version from manifest
  const getCurrentVersion = useCallback(async (): Promise<string> => {
    try {
      const manifest = chrome.runtime.getManifest();
      return manifest.version;
    } catch (error) {
      console.warn('Failed to get version from manifest:', error);
      return '1.0.0';
    }
  }, []);

  // Get version info from storage
  const getVersionInfo = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      const result = await chrome.storage.local.get('versionInfo');
      return result.versionInfo || null;
    } catch (error) {
      console.warn('Failed to get version info:', error);
      return null;
    }
  }, []);

  // Update version info in storage
  const updateVersionInfo = useCallback(async (versionInfo: VersionInfo): Promise<void> => {
    try {
      await chrome.storage.local.set({ versionInfo });
    } catch (error) {
      console.warn('Failed to update version info:', error);
    }
  }, []);

  // Mark changelog as read
  const markChangelogAsRead = useCallback(async (): Promise<void> => {
    const version = await getCurrentVersion();
    const existingInfo = await getVersionInfo();
    
    const updatedInfo: VersionInfo = {
      currentVersion: version,
      previousVersion: existingInfo?.currentVersion,
      lastSeenChangelogVersion: version,
      installDate: existingInfo?.installDate || new Date(),
      lastUpdateDate: new Date()
    };

    await updateVersionInfo(updatedInfo);
    setHasUnreadChangelog(false);
  }, [getCurrentVersion, getVersionInfo, updateVersionInfo]);

  // Check for version changes on mount
  useEffect(() => {
    const checkVersionChange = async () => {
      const version = await getCurrentVersion();
      setCurrentVersion(version);
      
      const versionInfo = await getVersionInfo();
      
      if (!versionInfo) {
        // First time install - don't show changelog immediately
        const newVersionInfo: VersionInfo = {
          currentVersion: version,
          lastSeenChangelogVersion: version,
          installDate: new Date(),
          lastUpdateDate: new Date()
        };
        await updateVersionInfo(newVersionInfo);
        setHasUnreadChangelog(false);
      } else if (versionInfo.currentVersion !== version) {
        // Version updated
        const updatedInfo: VersionInfo = {
          ...versionInfo,
          previousVersion: versionInfo.currentVersion,
          currentVersion: version,
          lastUpdateDate: new Date()
        };
        await updateVersionInfo(updatedInfo);
        
        // Show changelog if it hasn't been seen for this version
        const shouldShowChangelog = versionInfo.lastSeenChangelogVersion !== version;
        setHasUnreadChangelog(shouldShowChangelog);
      } else {
        // Same version, check if changelog was seen
        const shouldShowChangelog = versionInfo.lastSeenChangelogVersion !== version;
        setHasUnreadChangelog(shouldShowChangelog);
      }
    };

    checkVersionChange();
  }, [getCurrentVersion, getVersionInfo, updateVersionInfo]);

  return {
    hasUnreadChangelog,
    currentVersion,
    markChangelogAsRead,
    getVersionInfo
  };
};