// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Image,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { getPlotsByProjectId, getProjectById } from "../../../lib/api";

// interface Project {
//   id: string;
//   name: string;
//   location: string;
//   description: string;
//   imageUrl: string;
// }

// interface Plot {
//   id: string;
//   title: string;
//   dimension: string;
//   priceLabel: string;
//   status: string;
//   amenities: string[];
//   facing: string;
//   imageUrls: string[];
//   price: number;
// }

// export default function ProjectDetails() {
//   const router = useRouter();
//   const { id } = useLocalSearchParams();
//   const [project, setProject] = useState<Project | null>(null);
//   const [plots, setPlots] = useState<Plot[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!id) {
//       setError("Project ID is missing");
//       setLoading(false);
//       return;
//     }

//     const pid = Array.isArray(id) ? id[0] : id;
//     console.log("Loading project with ID:", pid);

//     const loadData = async () => {
//       try {
//         // First try to get project data
//         const proj = await getProjectById(pid);
//         if (proj) {
//           setProject(proj);
//         }

//         // Then get plots data
//         const plotList = await getPlotsByProjectId(pid);
//         if (plotList && plotList.length > 0) {
//           setPlots(plotList);
//           // If project data wasn't found but we have plots, use project data from plots
//           if (!proj && plotList[0].project) {
//             setProject(plotList[0].project);
//           }
//         }

//         if (!proj && (!plotList || plotList.length === 0)) {
//           setError("Project not found");
//         }
//       } catch (err) {
//         console.error("Error loading project:", err);
//         setError("Failed to load project details");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [id]);

//   if (loading) {
//     return (
//       <SafeAreaView className="flex-1 items-center justify-center bg-white">
//         <ActivityIndicator size="large" color="orange" />
//         <Text className="mt-4 text-gray-600 font-manrope">
//           Loading project details...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   if (error || !project) {
//     return (
//       <SafeAreaView className="flex-1 justify-center items-center bg-white p-4">
//         <Text className="text-red-500 text-lg font-manrope mb-4">
//           {error || "Project not found"}
//         </Text>
//         <TouchableOpacity
//           className="bg-orange-500 px-6 py-3 rounded-full"
//           onPress={() => router.back()}
//         >
//           <Text className="text-white font-manrope-bold">Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <ScrollView className="px-4">
//         {/* Optional: Display Project details if needed */}
//         {/* <Image
//           source={{ uri: project.imageUrl }}
//           className="w-full h-48 rounded-xl mt-4"
//           resizeMode="cover"
//         />
//         <Text className="text-2xl font-manrope-bold mt-4">{project.name}</Text>
//         <Text className="text-gray-500 font-manrope">{project.location}</Text>
//         <Text className="text-gray-700 mt-2 font-manrope">
//           {project.description}
//         </Text> */}

//         <Text className="text-xl font-manrope-bold mt-6 mb-2">
//           Available Plots in {project?.location}
//         </Text>

//         {plots.length === 0 ? (
//           <Text className="text-gray-400 font-manrope">No plots found.</Text>
//         ) : (
//           plots.map((plot) => (
//             <TouchableOpacity
//               key={plot.id}
//               className="bg-white rounded-xl shadow p-3 mb-4 border border-gray-100"
//               onPress={() => {
//                 router.push({
//                   pathname: "/(guest)/plot/[id]",
//                   params: { id: plot.id },
//                 });
//               }}
//             >
//               <View className="flex-row">
//                 <Image
//                   source={{ uri: plot.imageUrls[0] }}
//                   className="w-24 h-24 rounded-lg mr-3"
//                   resizeMode="cover"
//                 />

//                 <View className="flex-1 justify-between">
//                   <View>
//                     <Text className="text-base font-manrope-bold text-black">
//                       ₹{(plot.price / 100000).toFixed(2)} Lac Onwards
//                     </Text>
//                     <Text className="text-sm text-gray-800 font-manrope mt-1">
//                       {plot.title}
//                     </Text>
//                     <Text className="text-xs text-gray-400 font-manrope">
//                       {project?.location}
//                     </Text>
//                     <Text className="text-xs mt-1 text-gray-500 font-manrope">
//                       {plots.length} Plots Available{" "}
//                       {plot.status === "available" && (
//                         <Text className="text-green-500">🟢</Text>
//                       )}
//                     </Text>
//                   </View>
//                   <Text className="text-xs text-gray-400 font-manrope mt-1">
//                     {/* Assuming a default like 2 BHK - replace with actual data if available */}
//                     2 BHK+2T
//                   </Text>
//                 </View>
//               </View>

//               <View className="flex-row justify-between items-center mt-3">
//                 <Text className="text-xs text-gray-500 font-manrope">
//                   {plot.dimension}
//                 </Text>
//                 {/* Removed the inner View Details button as the whole card is clickable */}
//               </View>
//             </TouchableOpacity>
//           ))
//         )}

//         {plots.length === 0 && !loading && (
//           <Text className="text-gray-500 text-center font-manrope">
//             No plots available.
//           </Text>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }
