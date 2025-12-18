/**
 * Example: Cách sử dụng RouteMap với 2 giai đoạn
 *
 * Khi integrate vào MatchedRideScreen hoặc screen khác,
 * copy đoạn code này và điều chỉnh theo nhu cầu
 */

import React, { useState, useCallback } from "react";
import { View, Alert, Dimensions } from "react-native";
import RouteMap from "../components/RouteMap";

const { height } = Dimensions.get("window");

const ExampleUsage = () => {
  // BƯỚC 1: Chuẩn bị dữ liệu tọa độ
  const [pickupLocation] = useState({
    latitude: 10.7769,
    longitude: 106.7009,
  }); // Điểm đón khách (marker xanh)

  const [dropoffLocation] = useState({
    latitude: 10.8231,
    longitude: 106.6297,
  }); // Điểm đích (marker đỏ)

  const [driverLocation] = useState({
    latitude: 10.75, // Vị trí ban đầu của tài xế (cách điểm đón ~3km)
    longitude: 106.68,
  });

  // BƯỚC 2: Tạo callback để xử lý khi tài xế đến điểm đón
  const handleDriverArrived = useCallback(() => {
    console.log("✅ Driver arrived callback triggered!");

    // Option 1: Hiển thị Alert
    Alert.alert("🎉 Tài xế đã đến!", "Tài xế đang chờ bạn tại điểm đón", [
      {
        text: "OK",
        onPress: () => console.log("User acknowledged driver arrival"),
      },
    ]);

    // Option 2: Update UI state (ví dụ)
    // setDriverStatus('arrived');
    // setButtonText('Tài xế đã đến');

    // Option 3: Gửi API request
    // api.notifyDriverArrived(rideId);

    // Option 4: Navigate to another screen
    // navigation.navigate('OngoingRide');
  }, []);

  // BƯỚC 3: Render RouteMap
  return (
    <View style={{ flex: 1 }}>
      <RouteMap
        // Tọa độ điểm đón và đích
        origin={pickupLocation}
        destination={dropoffLocation}
        // VỊ TRÍ TÀI XẾ - Prop mới quan trọng!
        driverLocation={driverLocation}
        // Kích thước và hiển thị
        height={height * 0.5}
        showRoute={true}
        fullScreen={false}
        // Animation
        showVehicle={true}
        startAnimation={true}
        // Callback khi tài xế đến điểm đón
        onDriverArrived={handleDriverArrived}
        // Status
        rideStatus="matched"
      />

      {/* UI khác của bạn */}
    </View>
  );
};

export default ExampleUsage;

/**
 * FLOW HOẠT ĐỘNG:
 *
 * 1️⃣ GIAI ĐOẠN 1: Driver → Pickup (Marker Xanh)
 *    - Xe xuất hiện tại driverLocation (10.7500, 106.6800)
 *    - Vẽ route màu primary từ driverLocation → pickupLocation
 *    - Xe di chuyển theo route
 *    - Chỉ hiển thị marker xanh (điểm đón)
 *    - Marker đỏ CHƯA hiển thị
 *
 * 2️⃣ KHI ĐẾN ĐIỂM ĐÓN:
 *    - Console log: "🏁 Tài xế đã đến điểm đón!"
 *    - Gọi callback handleDriverArrived()
 *    - Alert hiển thị: "Tài xế đã đến!"
 *    - Đợi 2 giây...
 *
 * 3️⃣ GIAI ĐOẠN 2: Pickup (Marker Xanh) → Destination (Marker Đỏ)
 *    - Tự động chuyển phase
 *    - Vẽ route mới từ pickupLocation → dropoffLocation
 *    - Marker đỏ BẮT ĐẦU hiển thị
 *    - Xe di chuyển từ xanh đến đỏ
 *
 * 4️⃣ KHI ĐẾN ĐÍCH:
 *    - Console log: "🏁 Xe đã đến điểm đến cuối cùng!"
 *    - Animation dừng
 *
 *
 * LƯU Ý:
 * - Nếu KHÔNG truyền driverLocation, xe sẽ xuất hiện ngay tại pickupLocation
 * - Callback onDriverArrived chỉ được gọi 1 lần duy nhất
 * - Route được tính toán tự động từ OSRM API
 * - Animation speed: 100ms/frame
 */
