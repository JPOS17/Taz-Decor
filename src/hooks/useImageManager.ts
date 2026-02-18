import { useState } from "react";

export const useImageManager = () => {
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  const addImage = (imageUrl: string) => {
    setImages((prev) => [...prev, imageUrl]);
  };

  const deleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const setPrimary = (index: number) => {
    setPrimaryImageIndex(index);
  };

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