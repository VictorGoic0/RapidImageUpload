import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { UploadStatus } from '../types/photo';
import { UPLOAD_STATUS } from '../types/photo';

/**
 * Props for the UploadProgress component.
 */
interface UploadProgressProps {
  /** The name of the file */
  fileName: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current upload status */
  status: UploadStatus;
}

/**
 * Helper function to get the status icon based on upload status.
 */
function getStatusIcon(status: UploadStatus) {
  switch (status) {
    case UPLOAD_STATUS.COMPLETED:
      return <Text style={styles.statusIcon}>✓</Text>;
    case UPLOAD_STATUS.FAILED:
      return <Text style={[styles.statusIcon, styles.statusIconError]}>✗</Text>;
    case UPLOAD_STATUS.UPLOADING:
      return <ActivityIndicator size="small" color="#3b82f6" />;
    case UPLOAD_STATUS.PENDING:
      return <Text style={[styles.statusIcon, styles.statusIconPending]}>○</Text>;
    default:
      return <Text style={[styles.statusIcon, styles.statusIconPending]}>○</Text>;
  }
}

/**
 * Helper function to get the progress bar color based on status.
 */
function getProgressBarColor(status: UploadStatus): string {
  switch (status) {
    case UPLOAD_STATUS.COMPLETED:
      return '#10b981';
    case UPLOAD_STATUS.FAILED:
      return '#ef4444';
    case UPLOAD_STATUS.UPLOADING:
      return '#3b82f6';
    case UPLOAD_STATUS.PENDING:
      return '#9ca3af';
    default:
      return '#9ca3af';
  }
}

/**
 * Component for displaying individual file upload progress.
 */
export function UploadProgress({ fileName, progress, status }: UploadProgressProps) {
  // Truncate file name if too long
  const displayFileName = fileName.length > 40 ? `${fileName.substring(0, 40)}...` : fileName;
  const progressBarColor = getProgressBarColor(status);

  return (
    <View style={styles.container}>
      {/* Status icon on left */}
      <View style={styles.statusIconContainer}>{getStatusIcon(status)}</View>

      {/* File name and progress bar */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.fileName} numberOfLines={1}>
            {displayFileName}
          </Text>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Progress bar container */}
        <View style={styles.progressBarContainer}>
          {/* Filled progress bar */}
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: progressBarColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 20,
    color: '#10b981',
    fontWeight: 'bold',
  },
  statusIconError: {
    color: '#ef4444',
  },
  statusIconPending: {
    color: '#9ca3af',
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

