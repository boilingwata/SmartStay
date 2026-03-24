import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  onUpload: (urls: string[]) => void;
  uploadUrl?: string;
  showPreview?: boolean;
  dragDrop?: boolean;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxFiles = 1,
  maxSizeMB = 5,
  onUpload,
  uploadUrl = '/api/upload',
  showPreview = true,
  dragDrop = true,
  className,
}) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File ${file.name} quá lớn (tối đa ${maxSizeMB}MB)`);
      return false;
    }
    return true;
  };

  const handleUpload = async (fileToUpload: UploadingFile) => {
    setFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, status: 'uploading' } : f));
    
    // Simulated upload logic for demonstration
    // In real app, use axios or fetch with FormData and onUploadProgress
    try {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, progress } : f));
        if (progress >= 100) {
          clearInterval(interval);
          const mockUrl = URL.createObjectURL(fileToUpload.file); // Mock URL
          setFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, status: 'completed', url: mockUrl } : f));
          onUpload([mockUrl]);
        }
      }, 200);
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, status: 'error' } : f));
      toast.error(`Lỗi khi tải lên ${fileToUpload.file.name}`);
    }
  };

  const onFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadingFile[] = Array.from(selectedFiles)
      .filter(validateFile)
      .slice(0, maxFiles - files.length)
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending',
      }));

    if (newFiles.length === 0) return;

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(handleUpload);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {(dragDrop || files.length < maxFiles) && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            onFilesSelected(e.dataTransfer.files);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
            files.length >= maxFiles && "hidden"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => onFilesSelected(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-2 bg-white rounded-lg shadow-sm mb-2">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <p className="mb-1 text-sm text-gray-700 font-medium">
              Nhấn để tải lên hoặc kéo thả
            </p>
            <p className="text-xs text-gray-500">
              {accept?.replace(/\*/g, '') || 'Mọi định dạng'} (Tối đa {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {f.file.type.startsWith('image/') && showPreview ? (
                  <img 
                    src={URL.createObjectURL(f.file)} 
                    alt="preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <File className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.file.name}</p>
                  <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-300 rounded-full",
                      f.status === 'completed' ? "bg-green-500" : f.status === 'error' ? "bg-red-500" : "bg-blue-600"
                    )}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">{(f.file.size / 1024).toFixed(1)} KB</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium">
                    {f.status === 'uploading' && <><Loader2 className="w-3 h-3 animate-spin" /> {f.progress}%</>}
                    {f.status === 'completed' && <><CheckCircle2 className="w-3 h-3 text-green-500" /> Hoàn thành</>}
                    {f.status === 'error' && <span className="text-red-500">Lỗi</span>}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
