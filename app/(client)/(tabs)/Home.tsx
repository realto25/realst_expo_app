import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { getAllPlots, PlotType } from '../../../lib/api'

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [plots, setPlots] = useState<PlotType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlots()
  }, [])

  const fetchPlots = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllPlots()
      setPlots(data)
    } catch (err) {
      setError('Failed to load plots. Please try again later.')
      console.error('Error fetching plots:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlots = plots.filter(
    (plot) =>
      plot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const navigateToPlot = (plotId: string) => {
    router.push(`/plot/${plotId}`)
  }

  const renderPlotItem = ({ item }: { item: PlotType }) => (
    <TouchableOpacity
      onPress={() => navigateToPlot(item.id)}
      className="bg-white rounded-2xl mb-4 overflow-hidden shadow border border-gray-100"
    >
      <Image
        source={{ uri: item.imageUrls?.[0] }}
        className="w-full h-40"
        resizeMode="cover"
      />

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-black">
            ₹{(item.price / 100000).toFixed(2)} Lac Onwards
          </Text>
          <Ionicons name="heart-outline" size={20} color="#999" />
        </View>

        <Text className="text-sm font-semibold text-gray-800 mb-1">
          {item.title}
        </Text>

        <Text className="text-xs text-gray-500">{item.location}</Text>

        <View className="flex-row items-center mt-2">
          <Ionicons name="resize-outline" size={14} color="#FF6B00" />
          <Text className="text-xs text-gray-600 ml-1">
            {item.dimension}
          </Text>
        </View>

        <View className="flex-row items-center mt-1">
          <Ionicons name="pricetag-outline" size={14} color="#FF6B00" />
          <Text className="text-xs text-gray-600 ml-1">{item.priceLabel}</Text>
        </View>

        <View className="flex-row items-center mt-1">
          <Ionicons name="checkmark-circle-outline" size={14} color="#FF6B00" />
          <Text className="text-xs text-gray-600 ml-1 capitalize">
            Status:{" "}
            <Text
              className={
                item.status === 'available' ? 'text-green-600' : 'text-red-500'
              }
            >
              {item.status}
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4 text-gray-500">Loading plots...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B00" />
        <Text className="text-red-500 mt-4 text-center">{error}</Text>
        <TouchableOpacity
          onPress={fetchPlots}
          className="mt-4 px-5 py-3 bg-orange-500 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-orange-50">
      <View className="p-4">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <Ionicons name="search-outline" size={20} color="#FF6B00" />
          <TextInput
            placeholder="Search Plots"
            className="ml-2 flex-1 text-gray-800"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <FlatList
        data={filteredPlots}
        renderItem={renderPlotItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="search" size={64} color="#FFB380" />
            <Text className="mt-4 text-lg font-semibold text-gray-600">
              No plots found
            </Text>
            <Text className="mt-2 text-gray-500">
              Try a different keyword
            </Text>
          </View>
        }
      />
    </View>
  )
}
