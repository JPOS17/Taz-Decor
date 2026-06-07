import { useState } from "react";

// Custom hook to manage a list of image URLs with a designated primary image
export const useImageManager = () => {
  const [images, setImages] = useState<string[]>([]);
  // Index of the primary image within the images array
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  // Appends a new image URL to the end of the list
  const addImage = (imageUrl: string) => {
    setImages((prev) => [...prev, imageUrl]);
  };

  // Removes the image at the specified index and updates primary index if necessary
  const deleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  // Sets the image at the given index as the primary
  const setPrimary = (index: number) => {
    setPrimaryImageIndex(index);
  };

  // Returns a reordered array of images with the primary image first, followed by the rest in original order
  const getReorderedImages = () => {
    const reorderedImages = [...images];
    if (primaryImageIndex !== 0 && images.length > 0) {
      const primaryImage = reorderedImages.splice(primaryImageIndex, 1)[0];
      reorderedImages.unshift(primaryImage);
    }
    return reorderedImages;
  };

  return {
    images,
    primaryImageIndex,
    addImage,
    deleteImage,
    setPrimary,
    getReorderedImages,
  };
};
