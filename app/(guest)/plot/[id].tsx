import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getPlotById, PlotType } from '../../../lib/api';

const { width } = Dimensions.get('window');

export default function PlotDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plot, setPlot] = useState<PlotType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) {
      setError('Plot ID is missing');
      setLoading(false);
      return;
    }
    fetchPlotDetails();
  }, [id]);

  useEffect(() => {
    if (plot?.imageUrls?.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % plot.imageUrls.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [plot]);

  const fetchPlotDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error('Plot ID is required');
      }

      const plotId = Array.isArray(id) ? id[0] : id;
      const data = await getPlotById(plotId);

      if (!data) {
        throw new Error('Plot not found');
      }

      setPlot(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load plot details';
      setError(errorMessage);
      console.error('Error fetching plot details:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={{ width }}>
      <Image
        source={{ uri: item }}
        className="w-full h-80"
        resizeMode="cover"
      />
    </View>
  );

  const renderPaginationDots = () => {
    if (!plot?.imageUrls || plot.imageUrls.length <= 1) return null;

    return (
      <View className="flex-row justify-center absolute bottom-4 left-0 right-0">
        {plot.imageUrls.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    );
  };

  const onScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(newIndex);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="mt-4 text-gray-600 text-base">
          Loading plot details...
        </Text>
      </View>
    );
  }

  if (error || !plot) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <View className="bg-white p-8 rounded-2xl shadow-sm items-center">
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B35" />
          <Text className="text-gray-700 mt-4 text-center text-lg font-medium">
            {error || 'Plot not found'}
          </Text>
          <TouchableOpacity
            onPress={fetchPlotDetails}
            className="mt-6 px-8 py-3 bg-orange-500 rounded-xl shadow-sm"
          >
            <Text className="text-white font-semibold text-base">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View className="relative">
          <FlatList
            ref={flatListRef}
            data={plot.imageUrls || []}
            renderItem={renderImageItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            keyExtractor={(item, index) => index.toString()}
          />
          {renderPaginationDots()}

          {/* Header Controls */}
          <View className="absolute top-12 left-0 right-0 flex-row justify-between px-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/90 p-3 rounded-full shadow-sm"
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-white/90 p-3 rounded-full shadow-sm">
              <Ionicons name="heart-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Card */}
        <View className="bg-white mx-4 mt-[-20] rounded-t-3xl shadow-lg z-10">
          <View className="p-6">
            {/* Price Badge */}
            <View className="bg-orange-500 self-start px-4 py-2 rounded-full mb-4">
              <Text className="text-white font-bold text-lg">
                ₹{(plot.price / 100000).toFixed(2)} Lac
              </Text>
            </View>

            {/* Title and Location */}
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {plot.title}
            </Text>

            <View className="flex-row items-center mb-6">
              <Ionicons name="location" size={18} color="#FF6B35" />
              <Text className="text-gray-600 ml-2 text-base">
                {plot.location}
              </Text>
            </View>

            {/* Property Details Grid */}
            <View className="bg-gray-50 rounded-2xl p-5 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Property Details
              </Text>

              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] mb-4">
                  <Text className="text-gray-500 text-sm mb-1">Type</Text>
                  <Text className="text-gray-900 font-semibold">
                    Farm Land Sale
                  </Text>
                </View>

                <View className="w-[48%] mb-4">
                  <Text className="text-gray-500 text-sm mb-1">Plot Area</Text>
                  <Text className="text-gray-900 font-semibold">
                    {plot.dimension}
                  </Text>
                </View>

                <View className="w-[48%] mb-4">
                  <Text className="text-gray-500 text-sm mb-1">Dimension</Text>
                  <Text className="text-gray-900 font-semibold">
                    {plot.dimension}
                  </Text>
                </View>

                <View className="w-[48%] mb-4">
                  <Text className="text-gray-500 text-sm mb-1">Facing</Text>
                  <Text className="text-gray-900 font-semibold">
                    {plot.facing}
                  </Text>
                </View>
              </View>
            </View>

            {/* About Property */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                About Property
              </Text>
              <Text className="text-gray-600 leading-6">
                This agriculture/farm plot is available for sale at{' '}
                {plot.location}. It is a licensed plot in a very good area, the
                plot is measuring {plot.dimension}
                and priced {plot.priceLabel}.
              </Text>
            </View>

            {/* Amenities */}
            {plot.amenities && plot.amenities.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Amenities
                </Text>
                <View className="flex-row flex-wrap">
                  {plot.amenities.map((amenity, index) => (
                    <View
                      key={index}
                      className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-orange-600 font-medium">
                        {amenity}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Map View */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Location
              </Text>
              <View className="h-48 rounded-2xl overflow-hidden border border-gray-200">
                {plot.mapEmbedUrl ? (
                  <WebView
                    source={{
                      html: `
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                            <style>
                              body { margin: 0; padding: 0; }
                              iframe { width: 100%; height: 100%; border: none; }
                            </style>
                          </head>
                          <body>
                            <iframe
                              src="${plot.mapEmbedUrl}"
                              width="100%"
                              height="100%"
                              style="border:0;"
                              allowfullscreen=""
                              loading="lazy"
                              referrerpolicy="no-referrer-when-downgrade"
                            ></iframe>
                          </body>
                        </html>
                      `,
                    }}
                    style={{ flex: 1 }}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View className="absolute inset-0 bg-gray-100 justify-center items-center">
                        <ActivityIndicator size="small" color="#FF6B35" />
                      </View>
                    )}
                  />
                ) : (
                  <View className="flex-1 bg-gray-100 justify-center items-center">
                    <Ionicons
                      name="location-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                    <Text className="text-gray-500 mt-2">
                      Map not available
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status and Report */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-gray-500 text-sm mb-1">Status</Text>
                <Text
                  className={`font-semibold text-base ${
                    plot.status === 'available'
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}
                >
                  {plot.status === 'available' ? 'Available' : 'Sold Out'}
                </Text>
              </View>

              <TouchableOpacity className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full">
                <Ionicons name="flag-outline" size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2 font-medium">Report</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <Text className="text-yellow-800 font-semibold mb-2">
                Disclaimer
              </Text>
              <Text className="text-yellow-700 text-sm leading-5">
                All information displayed is by courtesy the user and displayed
                on the website for informational purposes only and space made
                available at our website.
              </Text>
              <TouchableOpacity className="mt-2">
                <Text className="text-orange-600 font-medium text-sm">
                  Read More
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="bg-white border-t border-gray-200 px-4 py-4 pb-8">
        <TouchableOpacity
          className="bg-orange-500 py-4 rounded-2xl shadow-lg"
          onPress={() => router.push(`/(guest)/book-visit/${plot.id}`)}
        >
          <Text className="text-white text-center font-bold text-lg">
            Book visit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
