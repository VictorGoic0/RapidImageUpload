import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { UploadStatus } from '../types/photo';
import { UPLOAD_STATUS } from '../types/photo';

/**
 * Upload information for a single file.
 */
interface UploadInfo {
  fileName: string;
  progress: number;
  status: UploadStatus;
}

/**
 * Props for the BatchProgress component.
 */
interface BatchProgressProps {
  /** Map of file names to upload information */
  uploads: Map<string, UploadInfo>;
}

/**
 * Component for displaying batch upload progress summary.
 */
export function BatchProgress({ uploads }: BatchProgressProps) {
  // Convert Map to Array for calculations
  const uploadArray = Array.from(uploads.values());
  const totalUploads = uploadArray.length;

  // Calculate overall progress percentage
  // Sum all individual progress values and divide by total number of uploads
  const overallProgress =
    totalUploads > 0
      ? uploadArray.reduce((sum, upload) => sum + upload.progress, 0) / totalUploads
      : 0;

  // Count completed uploads
  const completedCount = uploadArray.filter((upload) => upload.status === UPLOAD_STATUS.COMPLETED).length;

  // Count failed uploads
  const failedCount = uploadArray.filter((upload) => upload.status === UPLOAD_STATUS.FAILED).length;

  // Count uploading uploads
  const uploadingCount = uploadArray.filter((upload) => upload.status === UPLOAD_STATUS.UPLOADING).length;

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>
        {uploadingCount > 0
          ? `Uploading ${uploadingCount} of ${totalUploads} photos`
          : `Uploaded ${totalUploads} photos`}
      </Text>

      {/* Large progress bar for batch */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, overallProgress))}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <Text style={styles.progressPercentage}>{Math.round(overallProgress)}%</Text>
        </View>
      </View>

      {/* Count summary */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>
          <Text style={styles.statNumber}>{completedCount}</Text> completed
        </Text>
        {failedCount > 0 && (
          <Text style={[styles.statText, styles.statTextError]}>
            <Text style={[styles.statNumber, styles.statNumberError]}>{failedCount}</Text> failed
          </Text>
        )}
        {uploadingCount > 0 && (
          <Text style={[styles.statText, styles.statTextUploading]}>
            <Text style={[styles.statNumber, styles.statNumberUploading]}>{uploadingCount}</Text> uploading
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 14,
    color: '#374151',
  },
  statTextError: {
    color: '#374151',
  },
  statTextUploading: {
    color: '#374151',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  statNumberError: {
    color: '#ef4444',
  },
  statNumberUploading: {
    color: '#3b82f6',
  },
});

