import { useState, useEffect } from "react";

let sharedPath = [];
let listeners = new Set();

/**
 * Hook dùng để chia sẻ và cập nhật path (mảng tọa độ)
 * Giúp các component cùng cập nhật và theo dõi path mới nhất.
 */
export const useSharedPath = () => {
  const [path, setPath] = useState(sharedPath);

  // Khi mount → đăng ký lắng nghe thay đổi
  useEffect(() => {
    listeners.add(setPath);
    return () => listeners.delete(setPath);
  }, []);

  /**
   * Hàm cập nhật path mới (toàn cục)
   * @param {Array<{ latitude: number, longitude: number }>} newPath
   */
  const updatePath = (newPath) => {
    sharedPath = newPath;
    listeners.forEach((listener) => listener(sharedPath));
  };

  return { path, updatePath };
};
