import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UploadScreen from "@/components/UploadScreen";
import ResultsPage from "@/components/ResultsPage";
import AIAssistant from "@/components/AIAssistant";
import SettingsPanel from "@/components/SettingsPanel";
import type { ReportAnalysis, FoodRecommendation } from "@/lib/types";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [country, setCountry] = useState("");

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async (file: File, selectedCountry: string) => {
    setIsLoading(true);
    setCountry(selectedCountry);

    try {
      const base64 = await fileToBase64(file);
      const payload = { country: selectedCountry, imageBase64: base64 };

      const { data, error } = await supabase.functions.invoke("analyze-report", {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis({ ...data, foodGuide: [] });
      toast.success("Report analyzed successfully!");
    } catch (e: any) {
      console.error("Analysis error:", e);
      toast.error(e.message || "Failed to analyze report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodUpdate = (foods: FoodRecommendation[]) => {
    if (analysis) {
      setAnalysis({ ...analysis, foodGuide: foods });
      toast.success("Food recommendations updated!");
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCountry("");
  };

  return (
    <div className="min-h-screen bg-background">
      {!analysis ? (
        <UploadScreen onAnalyze={handleAnalyze} isLoading={isLoading} />
      ) : (
        <>
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">
                VitaScan <span className="gradient-primary bg-clip-text text-transparent">AI</span>
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  New Analysis
                </button>
                <SettingsPanel />
              </div>
            </div>
          </div>
          <ResultsPage analysis={analysis} country={country} onFoodUpdate={handleFoodUpdate} />
          <AIAssistant reportContext={analysis} country={country} />
        </>
      )}
    </div>
  );
};

export default Index;
