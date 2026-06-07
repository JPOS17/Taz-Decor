import { useRef } from "react";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your_preset";

// Extend the Window type to include the Cloudinary widget script global
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

// Configuration options for the Cloudinary widget
interface CloudinaryWidgetConfig {
  folder: string;
  multiple?: boolean;
  onSuccess: (imageUrl: string) => void;
  onError?: (error: any) => void;
}

// Custom hook to manage the Cloudinary upload widget
export const useCloudinaryWidget = () => {
  // Holds the widget instance across renders to avoid recreating it on every open
  const cloudinaryWidgetRef = useRef<{ open: () => void } | null>(null);

  const openWidget = ({
    folder,
    multiple = false,
    onSuccess,
    onError,
  }: CloudinaryWidgetConfig) => {
    if (!window.cloudinary) {
      // Cloudinary script not yet loaded — inject it and create the widget on load
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
        // Widget already exists — reuse it instead of creating a new instance
        cloudinaryWidgetRef.current.open();
        return;
      }

      cloudinaryWidgetRef.current = window.cloudinary!.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          // Allow uploads from local disk or camera only
          sources: ["local", "camera"],
          multiple,
          resourceType: "image",
          folder,
          // Force a 1:1 crop with custom coordinates — skip button disabled to require cropping
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
          showSkipCropButton: false,
          croppingCoordinatesMode: "custom",
          clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
          // 10 MB max file size
          maxImageFileSize: 10000000,
          showCompletedButton: true,
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            if (onError) onError(error);
            return;
          }

          // Only act on the final success event — ignore intermediate events (queued, uploading, etc.)
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
