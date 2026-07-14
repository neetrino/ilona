export interface UploadResult {
    key: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}
export interface PresignedUrlResult {
    uploadUrl: string;
    key: string;
    publicUrl: string;
}
