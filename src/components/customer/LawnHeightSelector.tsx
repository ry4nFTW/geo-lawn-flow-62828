import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors } from "lucide-react";

interface LawnHeightSelectorProps {
  selectedHeight: number | null;
  onHeightSelect: (height: number) => void;
}

export const LawnHeightSelector = ({ selectedHeight, onHeightSelect }: LawnHeightSelectorProps) => {
  const heights = [
    0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 
    3.0, 3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75, 5.0, 5.25, 5.5
  ];

  const getHeightColor = (height: number) => {
    // Green zone: 3.75" ± 1.00" (2.75" to 4.75")
    if (height >= 2.75 && height <= 4.75) {
      return "bg-green-500/20 border-green-500 text-green-700";
    }
    // Yellow zone: Outer ranges
    if ((height >= 2.0 && height < 2.75) || (height > 4.75 && height <= 5.5)) {
      return "bg-yellow-500/20 border-yellow-500 text-yellow-700";
    }
    // Red zone: Extreme ranges
    return "bg-red-500/20 border-red-500 text-red-700";
  };

  const getRecommendation = (height: number) => {
    if (height >= 2.75 && height <= 4.75) {
      return "Ideal Height";
    }
    if ((height >= 2.0 && height < 2.75) || (height > 4.75 && height <= 5.5)) {
      return "Acceptable";
    }
    if (height < 2.0) {
      return "Too Short";
    }
    return "Too Long";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Scissors className="h-4 w-4 text-primary" />
        <span className="font-medium">Cutting Height Preference:</span>
      </div>
      
      {/* Color Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-muted-foreground">Too Short/Long</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-muted-foreground">Acceptable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground">Ideal (3.75" ±1")</span>
        </div>
      </div>

      {/* Height Selection Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {heights.map((height) => (
          <Card
            key={height}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedHeight === height
                ? 'ring-2 ring-primary shadow-md scale-105'
                : 'hover:shadow-sm'
            } ${getHeightColor(height)}`}
            onClick={() => onHeightSelect(height)}
          >
            <CardContent className="p-2 text-center">
              <div className="text-sm font-medium">{height}"</div>
              <div className="text-xs text-muted-foreground mt-1">
                {getRecommendation(height)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedHeight && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="font-medium">Selected Height:</span>
            <Badge variant="outline" className={getHeightColor(selectedHeight)}>
              {selectedHeight}" - {getRecommendation(selectedHeight)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedHeight >= 2.75 && selectedHeight <= 4.75
              ? "Perfect! This height promotes healthy grass growth and appearance."
              : selectedHeight < 2.75
              ? "This height may stress the grass. Consider a slightly taller cut."
              : "This height may allow weeds to compete. Consider a shorter cut."}
          </p>
        </div>
      )}
    </div>
  );
};