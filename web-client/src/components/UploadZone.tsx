import { useState, useRef, type DragEvent } from 'react';
import { Upload } from 'lucide-react';

/**
 * Props for the UploadZone component.
 */
interface UploadZoneProps {
  /** Callback function called when files are selected */
  onFilesSelected: (files: File[]) => void;
}

/**
 * Component for drag-and-drop file upload with click-to-select fallback.
 */
export function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    // Filter for image files only (image/*)
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    // Validate max 100 files
    if (imageFiles.length > 100) {
      alert('Maximum 100 files allowed. Please select fewer files.');
      return;
    }

    if (imageFiles.length === 0) {
      alert('Please select image files only.');
      return;
    }

    // Call onFilesSelected with valid files
    onFilesSelected(imageFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Convert FileList to Array
      const fileArray = Array.from(files);
      // Filter for image files only
      const imageFiles = fileArray.filter((file) => file.type.startsWith('image/'));
      
      // Validate max 100 files
      if (imageFiles.length > 100) {
        alert('Maximum 100 files allowed. Please select fewer files.');
        return;
      }

      if (imageFiles.length === 0) {
        alert('Please select image files only.');
        return;
      }

      // Call onFilesSelected
      onFilesSelected(imageFiles);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-900'
          }
        `}
      >
        <Upload 
          className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} 
          size={48} 
        />
        <p className={`text-lg font-medium mb-2 ${isDragging ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
          Drag and drop photos here
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          or click to select files
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Maximum 100 files, images only
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}

