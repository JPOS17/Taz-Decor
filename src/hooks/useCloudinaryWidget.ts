import { useRef } from "react";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your_preset";

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        config: any,
        callback: (error: any, result: any) => void
      ) => {
        open: () => void;
      };
    };
  }
}

interface CloudinaryWidgetConfig {
  folder: string;
  multiple?: boolean;
  onSuccess: (imageUrl: string) => void;
  onError?: (error: any) => void;
}

export const useCloudinaryWidget = () => {
  const cloudinaryWidgetRef = useRef<{ open: () => void } | null>(null);

  const openWidget = ({
    folder,
    multiple = false,
    onSuccess,
    onError,
  }: CloudinaryWidgetConfig) => {
    if (!window.cloudinary) {
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.async = true;
      script.onload = () => createWidget();
      document.body.appendChild(script);
    } else {
      createWidget();
    }

    function createWidget() {
      if (cloudinaryWidgetRef.current) {
        cloudinaryWidgetRef.current.open();
        return;
      }

      cloudinaryWidgetRef.current = window.cloudinary!.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          sources: ["local", "camera"],
          multiple,
          resourceType: "image",
          folder,
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
          showSkipCropButton: false,
          croppingCoordinatesMode: "custom",
          clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
          maxImageFileSize: 10000000,
          showCompletedButton: true, 
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            if (onError) onError(error);
            return;
          }

          if (result.event === "success") {
            const imageUrl = result.info.secure_url;
            onSuccess(imageUrl);
          }
        }
      );

      cloudinaryWidgetRef.current.open();
    }
  };

  return { openWidget };
};