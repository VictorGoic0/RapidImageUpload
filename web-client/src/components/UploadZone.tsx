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
          relative border-2 border-dashed rounded-xl p-20 text-center cursor-pointer
          transition-all duration-200 min-h-[400px] flex flex-col items-center justify-center
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
          }
        `}
      >
        <Upload 
          className={`mx-auto mb-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} 
          size={80} 
        />
        <p className={`text-2xl font-semibold mb-3 ${isDragging ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
          Drag and drop photos here
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          or click to select files
        </p>
        <p className="text-base text-gray-500 dark:text-gray-500 mt-4">
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

