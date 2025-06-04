// components/LandGrid.tsx
import React from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  ADVANCE: "#facc15",
  SOLD: "#ef4444",
  EMPTY: "#e5e7eb",
};

interface Land {
  id: string;
  number: string;
  x: number;
  y: number;
  status: "AVAILABLE" | "ADVANCE" | "SOLD";
}

interface LandGridProps {
  lands: Land[];
  onPressLand?: (land: Land) => void;
  maxColumns?: number; // Optional prop to control number of columns
}

// Calculate cell size based on screen width and desired padding
const calculateCellSize = (columns: number) => {
  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 16; // 8px padding on each side
  const gapSize = 4; // Gap between cells
  const totalGaps = columns - 1;
  const availableWidth =
    screenWidth - horizontalPadding * 2 - gapSize * totalGaps;
  return Math.floor(availableWidth / columns);
};

const LandGrid: React.FC<LandGridProps> = ({
  lands,
  onPressLand,
  maxColumns = 6, // Default to 6 columns for a more compact grid
}) => {
  const CELL_SIZE = calculateCellSize(maxColumns);
  const COLUMNS = maxColumns;

  // Convert lands to 2D map
  const gridMap = new Map<string, Land>();
  let maxY = 0;
  lands.forEach((land) => {
    gridMap.set(`${land.x}-${land.y}`, land);
    if (land.y > maxY) maxY = land.y;
  });

  const allCells = [];
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      const key = `${x}-${y}`;
      const land = gridMap.get(key);
      allCells.push({ key, land, x, y });
    }
  }

  return (
    <View style={{ paddingHorizontal: 8 }}>
      <FlatList
        data={allCells}
        numColumns={COLUMNS}
        keyExtractor={(item) => item.key}
        scrollEnabled={false} // Disable scrolling since it's likely nested
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: 8,
        }}
        renderItem={({ item }) => {
          const { land } = item;
          const status = land?.status || "EMPTY";
          const bgColor = COLORS[status];

          return (
            <TouchableOpacity
              onPress={() => land && onPressLand?.(land)}
              disabled={!land}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                margin: 2, // Reduced margin
                backgroundColor: bgColor,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 4, // Reduced border radius
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: Math.max(CELL_SIZE * 0.2, 10), // Responsive font size
                }}
              >
                {land?.number || `${item.x}-${item.y}`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default LandGrid;
