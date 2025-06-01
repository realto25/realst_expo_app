import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export const onboardingSlides: SlideItem[] = [
  {
    id: 1,
    title: "Discover Plots with Ease",
    subtitle:
      "Explore real estate projects and plots near you with interactive maps and instant details.",
    image:
      "https://cdn.prod.website-files.com/5e3ce2ec7f6e53c045fe7cfa/61c56c2eef3c1d4f1e6e2817_House%20Auction.png",
  },
  {
    id: 2,
    title: "Book Site Visits Instantly",
    subtitle:
      "Schedule plot visits seamlessly and get QR code access just like booking a movie ticket.",
    image:
      "https://cdn.prod.website-files.com/5e3ce2ec7f6e53c045fe7cfa/61c5709600cb6de0e8489f2e_Property%20Registration.png",
  },
  {
    id: 3,
    title: "Track & Review Your Experience",
    subtitle:
      "Get visit approvals, scan your QR on arrival, and share feedback to improve service quality.",
    image:
      "https://cdn.prod.website-files.com/5e3ce2ec7f6e53c045fe7cfa/61c570108321d33b87e9808d_Property%20Estimation.png",
  },
];

const Onboarding = () => {
  const { isSignedIn } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (carouselRef.current) {
        const nextIndex = (activeIndex + 1) % onboardingSlides.length;
        carouselRef.current.scrollTo({ index: nextIndex, animated: true });
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const renderItem = ({ item }: { item: SlideItem }) => (
    <View className="flex-1 items-center justify-center px-4">
      <View className="w-96 h-96 items-center justify-center mb-6 mt-10">
        <Image
          source={{ uri: item.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="mt-8">
        <Text className="text-4xl font-manrope-bold text-center mb-4 text-gray-800">
          {item.title}
        </Text>
        <Text className="text-base mt-8 font-manrope text-center text-gray-600 px-4">
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  const Pagination = () => (
    <View className="flex-row justify-center items-center space-x-6 mt-2">
      {onboardingSlides.map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full  ${
            index === activeIndex ? "w-6 bg-primary" : "w-2 bg-gray-300"
          }`}
        />
      ))}
    </View>
  );

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.replace("/(guest)/(tabs)/Home");
    } else {
      router.push("/(auth)/sign-up");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <Carousel
          ref={carouselRef}
          data={onboardingSlides}
          renderItem={renderItem}
          width={width}
          height={height * 0.7}
          onSnapToItem={setActiveIndex}
          loop={true}
          autoPlay={false}
        />

        <View className="flex-1 justify-end pb-24 px-6">
          <Pagination />

          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-primary py-4 rounded-full mt-8"
          >
            <Text className="text-white text-center font-manrope-bold text-lg">
              {activeIndex === onboardingSlides.length - 1
                ? "Get Started"
                : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;
