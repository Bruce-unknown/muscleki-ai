import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodLog, HydrationLog } from '../types';
import { 
  Camera, 
  Sparkles, 
  Activity, 
  Trash2, 
  TrendingUp, 
  Loader2, 
  Apple, 
  Flame, 
  ChevronRight, 
  RotateCcw,
  Plus,
  AlertCircle,
  Sliders,
  Target,
  Check,
  Award,
  ChevronDown,
  ChevronUp,
  Settings,
  Droplet,
  Barcode
} from 'lucide-react';

interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  preset: 'balanced' | 'bulk' | 'cut' | 'custom';
  water_ml?: number;
}

const TARGET_PRESETS = {
  balanced: { calories: 2500, protein: 160, carbs: 260, fats: 70, name: "Balanced Maintenance" },
  bulk: { calories: 3200, protein: 200, carbs: 400, fats: 88, name: "Muscle Building Bulk" },
  cut: { calories: 1800, protein: 170, carbs: 150, fats: 50, name: "Fat Loss Shred" }
};

export default function NutritionScanner() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick helper to add a hydration log
  const handleAddHydration = async (volume: number, fluidType: string = "Water", caloriesAdded: number = 0) => {
    const newEntry = {
      user_id: 1,
      fluid_type: fluidType,
      volume_ml: volume,
      calories_added: caloriesAdded
    };

    try {
      const response = await fetch('/api/nutrition/hydration/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntry)
      });
      if (response.ok) {
        const result = await response.json();
        const updated = [result, ...hydrationLogs];
        setHydrationLogs(updated);
        localStorage.setItem('muscleki_hydration_logs', JSON.stringify(updated));
      } else {
        throw new Error("Failed to post hydration log to server");
      }
    } catch (err) {
      console.warn("Posting to server failed. Saving locally.", err);
      const localResult: HydrationLog = {
        id: Date.now(),
        user_id: 1,
        fluid_type: fluidType,
        volume_ml: volume,
        calories_added: caloriesAdded,
        logged_at: new Date().toISOString()
      };
      const updated = [localResult, ...hydrationLogs];
      setHydrationLogs(updated);
      localStorage.setItem('muscleki_hydration_logs', JSON.stringify(updated));
    }
  };

  // Quick helper to delete a hydration log
  const handleDeleteHydration = async (logId: number) => {
    try {
      const response = await fetch(`/api/nutrition/hydration/logs/${logId}?user_id=1`, {
        method: 'DELETE'
      });
      if (response.ok || response.status === 204) {
        const updated = hydrationLogs.filter(h => h.id !== logId);
        setHydrationLogs(updated);
        localStorage.setItem('muscleki_hydration_logs', JSON.stringify(updated));
      } else {
        throw new Error("Failed to delete hydration log from server");
      }
    } catch (err) {
      console.warn("Delete request failed. Modifying local state.", err);
      const updated = hydrationLogs.filter(h => h.id !== logId);
      setHydrationLogs(updated);
      localStorage.setItem('muscleki_hydration_logs', JSON.stringify(updated));
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanningStep, setScanningStep] = useState<string>('');
  const [scannerMode, setScannerMode] = useState<'camera' | 'barcode'>('camera');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // Custom Daily Goals state
  const [targets, setTargets] = useState<DailyTargets>(() => {
    const saved = localStorage.getItem('muscleki_nutrition_targets');
    return saved ? JSON.parse(saved) : {
      calories: 2500,
      protein: 160,
      carbs: 260,
      fats: 70,
      preset: 'balanced',
      water_ml: 3000
    };
  });

  // Keep targets synchronized with background modifications instantly
  useEffect(() => {
    const loadTargets = () => {
      const saved = localStorage.getItem('muscleki_nutrition_targets');
      if (saved) {
        setTargets(JSON.parse(saved));
      }
    };
    
    // Also fetch initial user profile if logged on
    const fetchProfileTargets = async () => {
      try {
        const res = await fetch('/api/auth/profile?user_id=1');
        if (res.ok) {
          const data = await res.json();
          if (data.targets) {
            const serverTargets = {
              calories: data.targets.calories,
              protein: data.targets.protein,
              carbs: data.targets.carbs,
              fats: data.targets.fats,
              water_ml: data.targets.water_ml,
              preset: data.user.fitness_goal === 'lose' ? 'cut' : data.user.fitness_goal === 'gain' ? 'bulk' : 'balanced'
            };
            setTargets(serverTargets);
            localStorage.setItem('muscleki_nutrition_targets', JSON.stringify(serverTargets));
          }
        }
      } catch (err) {
        console.warn("Could not sync with profile API:", err);
      }
    };

    fetchProfileTargets();
    window.addEventListener('storage', loadTargets);
    window.addEventListener('profile-updated', loadTargets);
    return () => {
      window.removeEventListener('storage', loadTargets);
      window.removeEventListener('profile-updated', loadTargets);
    };
  }, []);

  // Seamless Metric/Imperial Toggle State
  const [unit, setUnit] = useState<'metric' | 'imperial'>(() => {
    const saved = localStorage.getItem('muscleki_nutrition_unit');
    return (saved === 'imperial' || saved === 'metric') ? saved : 'metric';
  });

  const handleUnitToggle = (newUnit: 'metric' | 'imperial') => {
    setUnit(newUnit);
    localStorage.setItem('muscleki_nutrition_unit', newUnit);
  };

  const formatWeight = (grams: number) => {
    if (unit === 'imperial') {
      const oz = grams * 0.035274;
      return `${oz.toFixed(2)} oz`;
    }
    return `${grams.toFixed(1)}g`;
  };

  const [showConfig, setShowConfig] = useState(false);

  // Latest scan result state
  const [latestScan, setLatestScan] = useState<FoodLog | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    "Initializing neural camera alignment...",
    "Isolating nutritional boundaries & volume metrics...",
    "Detecting global culinary preparation style...",
    "Estimating ingredient density and portions...",
    "Calculating macronutrient caloric weight ratios...",
    "Finalizing sports nutrition telemetry..."
  ];

  // Fetch food and hydration logs on component mount
  useEffect(() => {
    fetchLogs();
    fetchHydrationLogs();
  }, []);

  // Keyboard shortcut listener to trigger file input click
  useEffect(() => {
    const handleTriggerUpload = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    window.addEventListener('trigger-nutrition-upload', handleTriggerUpload);
    return () => {
      window.removeEventListener('trigger-nutrition-upload', handleTriggerUpload);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/nutrition/logs?user_id=1');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        throw new Error("Failed to load logs");
      }
    } catch (err) {
      console.warn("Backend logs endpoint unavailable. Falling back to local state storage.", err);
      const saved = localStorage.getItem('muscleki_food_logs');
      if (saved) {
        setLogs(JSON.parse(saved));
      }
    }
  };

  const fetchHydrationLogs = async () => {
    try {
      const response = await fetch('/api/nutrition/hydration/logs?user_id=1');
      if (response.ok) {
        const data = await response.json();
        setHydrationLogs(data);
      } else {
        throw new Error("Failed to load hydration logs");
      }
    } catch (err) {
      console.warn("Backend hydration logs endpoint unavailable. Falling back to local state storage.", err);
      const saved = localStorage.getItem('muscleki_hydration_logs');
      if (saved) {
        setHydrationLogs(JSON.parse(saved));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError("Please select or capture an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    // Animation loop for scanning steps
    let currentStepIdx = 0;
    setScanningStep(scanSteps[0]);
    const stepInterval = setInterval(() => {
      if (currentStepIdx < scanSteps.length - 1) {
        currentStepIdx++;
        setScanningStep(scanSteps[currentStepIdx]);
      }
    }, 1200);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/nutrition/scan?user_id=1', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);

      if (response.ok) {
        const result: FoodLog = await response.json();
        setLatestScan(result);
        
        // Prepend to logs
        const updatedLogs = [result, ...logs];
        setLogs(updatedLogs);
        localStorage.setItem('muscleki_food_logs', JSON.stringify(updatedLogs));

        // Auto-hydration sync
        if (result.fluid_volume_ml && result.fluid_volume_ml > 0) {
          handleAddHydration(result.fluid_volume_ml, result.food_name, result.calories);
        }

        // Reset state
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        throw new Error("Scanner server returned an error.");
      }
    } catch (err) {
      console.error(err);
      clearInterval(stepInterval);
      
      // Local fallback for smooth demonstration in standard preview
      const fallbackMealName = selectedFile.name.toLowerCase();
      let simulatedResult: FoodLog = {
        id: Date.now(),
        user_id: 1,
        food_name: "Grilled Chicken Protein Bowl (Simulated Fallback)",
        calories: 450,
        protein: 38.0,
        carbs: 32.0,
        fats: 14.5,
        scanned_at: new Date().toISOString()
      };

      if (fallbackMealName.includes('salmon') || fallbackMealName.includes('fish')) {
        simulatedResult = {
          id: Date.now(),
          user_id: 1,
          food_name: "Seared Salmon with Asparagus (Simulated Fallback)",
          calories: 520,
          protein: 41.2,
          carbs: 12.0,
          fats: 28.5,
          scanned_at: new Date().toISOString()
        };
      } else if (fallbackMealName.includes('egg') || fallbackMealName.includes('toast') || fallbackMealName.includes('breakfast')) {
        simulatedResult = {
          id: Date.now(),
          user_id: 1,
          food_name: "Avocado Sourdough & Poached Eggs (Simulated Fallback)",
          calories: 480,
          protein: 20.0,
          carbs: 36.5,
          fats: 22.0,
          scanned_at: new Date().toISOString()
        };
      } else if (fallbackMealName.includes('juice') || fallbackMealName.includes('smoothie') || fallbackMealName.includes('drink') || fallbackMealName.includes('beverage') || fallbackMealName.includes('orange') || fallbackMealName.includes('sugarcane')) {
        simulatedResult = {
          id: Date.now(),
          user_id: 1,
          food_name: "Fresh Fruit Smoothie (Simulated Fallback)",
          calories: 240,
          protein: 3.5,
          carbs: 48.0,
          fats: 1.5,
          fluid_volume_ml: 350,
          scanned_at: new Date().toISOString()
        };
      } else if (fallbackMealName.includes('shake') || fallbackMealName.includes('protein')) {
        simulatedResult = {
          id: Date.now(),
          user_id: 1,
          food_name: "Banana Oats Whey Protein Shake (Simulated Fallback)",
          calories: 390,
          protein: 34.0,
          carbs: 45.0,
          fats: 8.0,
          scanned_at: new Date().toISOString()
        };
      }

      setLatestScan(simulatedResult);
      const updatedLogs = [simulatedResult, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('muscleki_food_logs', JSON.stringify(updatedLogs));
      
      // Auto-hydration sync for simulated fallback
      if (simulatedResult.fluid_volume_ml && simulatedResult.fluid_volume_ml > 0) {
        handleAddHydration(simulatedResult.fluid_volume_ml, simulatedResult.food_name, simulatedResult.calories);
      }
      
      // Soft notification of fallback estimation
      setError("Note: Running offline estimation engine due to server connection limit.");
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async (code: string) => {
    if (!code || !code.trim()) {
      setError("Please enter or select a valid barcode.");
      return;
    }

    setLoading(true);
    setError(null);
    setScanningStep("Querying global Open Food Facts API...");

    try {
      // 1. Fetch barcode details from our server endpoint
      const response = await fetch(`/api/barcode/scan/${code.trim()}`);
      if (!response.ok) {
        throw new Error("Product database or local simulation lookup failed. Please double check the barcode.");
      }

      const scanData = await response.json();
      if (scanData.status !== "success" || !scanData.product) {
        throw new Error("Product data is missing or not indexed in Open Food Facts.");
      }

      const product = scanData.product;

      // 2. Submit the logged item to our backend POST /logs endpoint
      const logResponse = await fetch('/api/nutrition/logs?user_id=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 1,
          food_name: product.product_name,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fats: product.fats,
          fluid_volume_ml: product.fluid_volume_ml
        })
      });

      let savedLog: FoodLog;
      if (logResponse.ok) {
        savedLog = await logResponse.json();
      } else {
        // Fallback to local storage logging if database creation is unconfigured
        savedLog = {
          id: Date.now(),
          user_id: 1,
          food_name: product.product_name,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fats: product.fats,
          fluid_volume_ml: product.fluid_volume_ml,
          scanned_at: new Date().toISOString()
        };
      }

      // 3. Update active scanner result dashboard and logs list
      setLatestScan(savedLog);
      const updatedLogs = [savedLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('muscleki_food_logs', JSON.stringify(updatedLogs));

      // 4. Hydration logging synchronicity
      if (product.fluid_volume_ml && product.fluid_volume_ml > 0) {
        await handleAddHydration(product.fluid_volume_ml, product.product_name, product.calories);
      }

      setBarcodeInput("");
    } catch (err: any) {
      console.error("Barcode scan failure:", err);
      setError(err?.message || "Failed to fetch barcode nutrition data.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryDemoMeal = () => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    
    // Choose a random meal from the preset demo list
    const demoMeals = [
      {
        food_name: "Paneer Butter Masala with Roti (India)",
        calories: 720,
        protein: 28.0,
        carbs: 65.0,
        fats: 38.0,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80"
      },
      {
        food_name: "Avocado Bacon Cheeseburger (USA)",
        calories: 850,
        protein: 42.0,
        carbs: 40.0,
        fats: 54.0,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"
      },
      {
        food_name: "Salmon Sushi & Edamame Set (East Asia)",
        calories: 540,
        protein: 32.0,
        carbs: 68.0,
        fats: 12.0,
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80"
      },
      {
        food_name: "Grilled Chicken Protein Bowl",
        calories: 650,
        protein: 45.0,
        carbs: 55.0,
        fats: 15.0,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"
      },
      {
        food_name: "Avocado Toast with Egg",
        calories: 420,
        protein: 18.0,
        carbs: 32.0,
        fats: 24.0,
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80"
      },
      {
        food_name: "Seared Salmon and Quinoa",
        calories: 580,
        protein: 38.0,
        carbs: 42.0,
        fats: 26.0,
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80"
      },
      {
        food_name: "Greek Yogurt Parfait with Berries",
        calories: 310,
        protein: 24.0,
        carbs: 38.0,
        fats: 6.0,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80"
      },
      {
        food_name: "Fresh Sugarcane Juice (India)",
        calories: 220,
        protein: 1.0,
        carbs: 52.0,
        fats: 0.0,
        fluid_volume_ml: 350,
        image: "https://images.unsplash.com/photo-1595981267035-7b04ec82a897?w=500&q=80"
      },
      {
        food_name: "Organic Orange Juice (USA)",
        calories: 110,
        protein: 2.0,
        carbs: 26.0,
        fats: 0.0,
        fluid_volume_ml: 250,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80"
      },
      {
        food_name: "Matcha Green Tea Smoothie (East Asia)",
        calories: 180,
        protein: 6.0,
        carbs: 24.0,
        fats: 5.0,
        fluid_volume_ml: 300,
        image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&q=80"
      }
    ];

    const randomMeal = demoMeals[Math.floor(Math.random() * demoMeals.length)];
    
    // Set a preview image for the visual scanning effect
    setPreviewUrl(randomMeal.image);

    // Run rapid mock scanning steps
    let currentStepIdx = 0;
    setScanningStep("Connecting to neural simulation matrix...");
    const stepInterval = setInterval(() => {
      if (currentStepIdx < scanSteps.length) {
        setScanningStep(scanSteps[currentStepIdx]);
        currentStepIdx++;
      }
    }, 350);

    setTimeout(() => {
      clearInterval(stepInterval);
      
      const newLog: FoodLog = {
        id: Date.now(),
        user_id: 1,
        food_name: randomMeal.food_name,
        calories: randomMeal.calories,
        protein: randomMeal.protein,
        carbs: randomMeal.carbs,
        fats: randomMeal.fats,
        fluid_volume_ml: randomMeal.fluid_volume_ml,
        scanned_at: new Date().toISOString()
      };

      setLatestScan(newLog);
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('muscleki_food_logs', JSON.stringify(updatedLogs));

      // Auto-hydration sync for demo simulator
      if (randomMeal.fluid_volume_ml && randomMeal.fluid_volume_ml > 0) {
        handleAddHydration(randomMeal.fluid_volume_ml, randomMeal.food_name, randomMeal.calories);
      }

      // Reset scanning view states
      setLoading(false);
      setPreviewUrl(null);
    }, 2400);
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      const response = await fetch(`/api/nutrition/logs/${logId}?user_id=1`, {
        method: 'DELETE'
      });
      if (response.ok || response.status === 204) {
        // Success
      } else {
        throw new Error("Failed to delete from server");
      }
    } catch (err) {
      console.warn("Could not sync deletion with server, deleting from local cache only.", err);
    }
    
    const updated = logs.filter(item => item.id !== logId);
    setLogs(updated);
    localStorage.setItem('muscleki_food_logs', JSON.stringify(updated));
    if (latestScan && latestScan.id === logId) {
      setLatestScan(null);
    }
  };

  const handleClearAll = () => {
    setLogs([]);
    localStorage.removeItem('muscleki_food_logs');
    setLatestScan(null);
  };

  const applyPreset = (key: 'balanced' | 'bulk' | 'cut') => {
    const presetData = TARGET_PRESETS[key];
    const newTargets = {
      ...presetData,
      preset: key
    };
    setTargets(newTargets);
    localStorage.setItem('muscleki_nutrition_targets', JSON.stringify(newTargets));
  };

  const handleTargetChange = (field: keyof Omit<DailyTargets, 'preset'>, val: number) => {
    const newTargets = {
      ...targets,
      [field]: val,
      preset: 'custom' as const
    };
    setTargets(newTargets);
    localStorage.setItem('muscleki_nutrition_targets', JSON.stringify(newTargets));
  };

  // Compute stats for today
  const getTodayLogs = () => {
    const todayStr = new Date().toDateString();
    return logs.filter(log => new Date(log.scanned_at).toDateString() === todayStr);
  };

  const todayLogs = getTodayLogs();
  const todayCalories = todayLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const todayProtein = todayLogs.reduce((acc, curr) => acc + curr.protein, 0);
  const todayCarbs = todayLogs.reduce((acc, curr) => acc + curr.carbs, 0);
  const todayFats = todayLogs.reduce((acc, curr) => acc + curr.fats, 0);

  // Percentages relative to configured targets
  const calPercent = Math.round((todayCalories / targets.calories) * 100);
  const protPercent = Math.round((todayProtein / targets.protein) * 100);
  const carbPercent = Math.round((todayCarbs / targets.carbs) * 100);
  const fatPercent = Math.round((todayFats / targets.fats) * 100);

  // Textual assessment message
  const getMacroAssessment = () => {
    if (todayLogs.length === 0) {
      return { text: "No nutrition scans recorded today yet. Log your first meal to track muscle performance ratios.", level: "info" };
    }
    if (protPercent >= 100) {
      return { text: "Fantastic! Protein threshold achieved. Optimal amino acid levels for cellular repair and hypertrophy loaded.", level: "success" };
    }
    if (protPercent >= 70) {
      return { text: "Looking solid. Almost met your daily protein target. One more high-protein snack will complete your profile.", level: "progress" };
    }
    if (calPercent > 100) {
      return { text: "Daily calorie goal exceeded. Ratios adjusted for performance buffer. Keep monitoring macro alignment.", level: "warning" };
    }
    return { text: "Daily macro target tracks initialized. Scan lunch/dinner to complete performance telemetry.", level: "info" };
  };

  const assessment = getMacroAssessment();

  // Compute stats for today's hydration
  const getTodayHydrationLogs = () => {
    const todayStr = new Date().toDateString();
    return hydrationLogs.filter(log => new Date(log.logged_at).toDateString() === todayStr);
  };

  const todayHydrationLogs = getTodayHydrationLogs();
  const todayHydration = todayHydrationLogs.reduce((acc, curr) => acc + curr.volume_ml, 0);
  const hydrationTarget = targets.water_ml || 3000;
  const hydrationPercent = Math.round((todayHydration / hydrationTarget) * 100);

  return (
    <div className="space-y-8" id="ai-nutrition-scanner-dashboard">
      
      {/* Target goals control section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/[0.03] to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500 animate-pulse" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-white">Daily Target Blueprint</h3>
            </div>
            <p className="text-[11px] text-zinc-400">
              Current Focus: <span className="text-orange-400 font-bold font-mono capitalize">{targets.preset === 'custom' ? 'Custom Blueprint' : TARGET_PRESETS[targets.preset]?.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Seamless Metric/Imperial Selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => handleUnitToggle('metric')}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-all duration-200 ${
                  unit === 'metric'
                    ? 'bg-orange-600 text-black shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                METRIC (g)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('imperial')}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-all duration-200 ${
                  unit === 'imperial'
                    ? 'bg-orange-600 text-black shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                IMPERIAL (oz)
              </button>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-bold rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              ADJUST GOALS
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Configuration Console */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-zinc-900 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Presets Selection */}
                <div className="lg:col-span-4 space-y-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">1. Select Target Preset</span>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(TARGET_PRESETS) as Array<keyof typeof TARGET_PRESETS>).map((key) => (
                      <button
                        key={key}
                        onClick={() => applyPreset(key)}
                        className={`p-3 rounded-lg border text-left transition-all duration-200 font-mono ${
                          targets.preset === key
                            ? 'border-orange-500 bg-orange-500/[0.04] text-white'
                            : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{TARGET_PRESETS[key].name}</span>
                          {targets.preset === key && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1">
                          {TARGET_PRESETS[key].calories} kcal · P: {TARGET_PRESETS[key].protein}g · C: {TARGET_PRESETS[key].carbs}g · F: {TARGET_PRESETS[key].fats}g
                        </p>
                      </button>
                    ))}

                    <div className={`p-3 rounded-lg border text-left font-mono ${
                      targets.preset === 'custom'
                        ? 'border-orange-500 bg-orange-500/[0.04] text-white'
                        : 'border-zinc-900 bg-zinc-900/40 text-zinc-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Custom Macro Config</span>
                        {targets.preset === 'custom' && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1">Manual real-time sliders enabled below</p>
                    </div>
                  </div>
                </div>

                {/* Fine tuning sliders */}
                <div className="lg:col-span-8 space-y-4 bg-zinc-900/20 border border-zinc-900 rounded-xl p-4">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">2. Fine-Tune Specific Boundaries</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Calories Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-zinc-400">Calories Limit</span>
                        <span className="text-white font-bold">{targets.calories} <span className="text-zinc-500 font-normal">kcal</span></span>
                      </div>
                      <input 
                        type="range" 
                        min="1200" 
                        max="5000" 
                        step="50"
                        value={targets.calories} 
                        onChange={(e) => handleTargetChange('calories', parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-ew-resize bg-zinc-800 rounded-lg h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                        <span>1200 kcal</span>
                        <span>5000 kcal</span>
                      </div>
                    </div>

                    {/* Protein Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-orange-400">Protein Target</span>
                        <span className="text-white font-bold">{formatWeight(targets.protein)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="40" 
                        max="300" 
                        step="5"
                        value={targets.protein} 
                        onChange={(e) => handleTargetChange('protein', parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-ew-resize bg-zinc-800 rounded-lg h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                        <span>{formatWeight(40)}</span>
                        <span>{formatWeight(300)}</span>
                      </div>
                    </div>

                    {/* Carbs Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-zinc-300">Carbohydrates</span>
                        <span className="text-white font-bold">{formatWeight(targets.carbs)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="600" 
                        step="5"
                        value={targets.carbs} 
                        onChange={(e) => handleTargetChange('carbs', parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-ew-resize bg-zinc-800 rounded-lg h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                        <span>{formatWeight(50)}</span>
                        <span>{formatWeight(600)}</span>
                      </div>
                    </div>

                    {/* Fats Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-zinc-500">Fats Goal</span>
                        <span className="text-white font-bold">{formatWeight(targets.fats)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="200" 
                        step="2"
                        value={targets.fats} 
                        onChange={(e) => handleTargetChange('fats', parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-ew-resize bg-zinc-800 rounded-lg h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                        <span>{formatWeight(20)}</span>
                        <span>{formatWeight(200)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={() => setShowConfig(false)}
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-black text-xs font-bold font-mono rounded-lg transition-all"
                    >
                      APPLY CHANGES
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 1. Header Overview Cards with Daily Goal Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Calories Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/[0.02] to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Calories Today</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              calPercent >= 100 ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
            }`}>
              {calPercent}%
            </span>
          </div>

          <div className="space-y-1 mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">{todayCalories}</span>
              <span className="text-xs font-mono text-zinc-500">/ {targets.calories} kcal</span>
            </div>
            
            {/* High polish continuous progress bar */}
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1 relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  calPercent > 100 ? 'bg-red-500' : calPercent >= 100 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(calPercent, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-1">
              <span>{Math.max(targets.calories - todayCalories, 0)} kcal left</span>
              <span>Daily Target</span>
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/[0.02] to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Protein Intake</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              protPercent >= 100 ? 'bg-green-500/10 text-green-400' : 'bg-orange-400/10 text-orange-400'
            }`}>
              {protPercent}%
            </span>
          </div>

          <div className="space-y-1 mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-orange-400">
                {unit === 'imperial' ? (todayProtein * 0.035274).toFixed(2) : todayProtein.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-zinc-500">/ {formatWeight(targets.protein)}</span>
            </div>
            
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  protPercent >= 100 ? 'bg-green-500' : 'bg-orange-400'
                }`}
                style={{ width: `${Math.min(protPercent, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-1">
              <span>{(todayProtein * 4).toFixed(0)} kcal logged</span>
              <span>Anabolic threshold</span>
            </div>
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/[0.02] to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Carbs Intake</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              carbPercent >= 100 ? 'bg-green-500/10 text-green-400' : 'bg-zinc-400/10 text-zinc-300'
            }`}>
              {carbPercent}%
            </span>
          </div>

          <div className="space-y-1 mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-zinc-300">
                {unit === 'imperial' ? (todayCarbs * 0.035274).toFixed(2) : todayCarbs.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-zinc-500">/ {formatWeight(targets.carbs)}</span>
            </div>
            
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  carbPercent >= 100 ? 'bg-green-500' : 'bg-zinc-300'
                }`}
                style={{ width: `${Math.min(carbPercent, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-1">
              <span>{(todayCarbs * 4).toFixed(0)} kcal logged</span>
              <span>Glycogen buffer</span>
            </div>
          </div>
        </div>

        {/* Fats Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/[0.02] to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Fats Intake</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              fatPercent >= 100 ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'
            }`}>
              {fatPercent}%
            </span>
          </div>

          <div className="space-y-1 mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-zinc-400">
                {unit === 'imperial' ? (todayFats * 0.035274).toFixed(2) : todayFats.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-zinc-500">/ {formatWeight(targets.fats)}</span>
            </div>
            
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  fatPercent >= 100 ? 'bg-green-500' : 'bg-zinc-500'
                }`}
                style={{ width: `${Math.min(fatPercent, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-1">
              <span>{(todayFats * 9).toFixed(0)} kcal logged</span>
              <span>Hormonal support</span>
            </div>
          </div>
        </div>

      </div>

      {/* Hydration & Fluids Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/[0.04] to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-400 fill-blue-400/20 animate-bounce" />
              <h3 className="font-sans font-medium text-lg text-white tracking-tight">Hydration & Fluids</h3>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Track your daily fluid intake. Scanning healthy beverages like juices, teas, or smoothies automatically adds them here.
            </p>
          </div>
          
          {/* Quick-add buttons */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => handleAddHydration(250, "Water Cup", 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-mono font-medium text-blue-400 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> +250ml Cup
            </button>
            <button
              onClick={() => handleAddHydration(500, "Water Bottle", 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-mono font-medium text-blue-400 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> +500ml Bottle
            </button>
            
            {/* Custom Add Trigger Input */}
            <div className="flex items-center border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden text-xs font-mono">
              <input
                type="number"
                placeholder="Custom"
                id="custom-fluid-input"
                className="w-16 px-2 py-1.5 bg-transparent text-white outline-none placeholder-zinc-600 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (val > 0) {
                      handleAddHydration(val, "Water (Custom)", 0);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <span className="text-zinc-500 pr-2 select-none">ml</span>
            </div>
          </div>
        </div>

        {/* Droplet UI progress bar */}
        <div className="space-y-2 mt-6">
          <div className="flex justify-between items-baseline">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-blue-400 tracking-tight">{todayHydration}</span>
              <span className="text-zinc-500 text-sm font-mono">/ {hydrationTarget} ml</span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              {hydrationPercent}% Daily Goal
            </span>
          </div>
          
          <div className="w-full h-3 bg-zinc-900 border border-zinc-800/50 rounded-full overflow-hidden mt-1 relative p-[2px]">
            {/* Wave / droplets effect */}
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 relative overflow-hidden"
              style={{ width: `${Math.min(hydrationPercent, 100)}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[pulse_1.5s_infinite]" />
            </div>
          </div>
          
          {/* Recent logs inline list */}
          {todayHydrationLogs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-900">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">Today's Fluid Log</span>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                {todayHydrationLogs.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/40 rounded-md text-[11px] text-zinc-300">
                    <span className="font-semibold text-blue-400">{item.volume_ml}ml</span>
                    <span className="text-zinc-500">•</span>
                    <span className="max-w-[120px] truncate">{item.fluid_type}</span>
                    <button 
                      onClick={() => handleDeleteHydration(item.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Target Progress Assessment callout */}
      <div className={`p-4 border rounded-xl flex items-start gap-3 transition-colors ${
        assessment.level === 'success' 
          ? 'bg-green-500/5 border-green-500/20 text-green-400' 
          : assessment.level === 'warning'
          ? 'bg-red-500/5 border-red-500/20 text-red-400'
          : 'bg-orange-500/5 border-orange-500/20 text-orange-400'
      }`}>
        <Award className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">AI Nutrition Assessment</span>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">{assessment.text}</p>
        </div>
      </div>

      {/* 2. Core Interactive Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Card: Camera Capture and Scan triggers (takes 5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden" id="camera-capture-panel">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                  {scannerMode === 'camera' ? <Camera className="w-4 h-4 text-orange-500" /> : <Barcode className="w-4 h-4 text-orange-500" />}
                  AI Nutrition Scanner
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {scannerMode === 'camera' ? "Capture meal or upload dish directly" : "Scan Indian or global product barcodes"}
                </p>
              </div>
              <span className="text-[9px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
                GEMINI 2.5 ACTIVE
              </span>
            </div>

            {/* Scanner Mode Toggle Tab */}
            <div className="grid grid-cols-2 gap-2 mb-6 bg-zinc-900/40 p-1 rounded-xl border border-zinc-900">
              <button
                type="button"
                onClick={() => { setScannerMode('camera'); setError(null); }}
                className={`py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  scannerMode === 'camera'
                    ? 'bg-orange-600 text-black shadow-lg shadow-orange-500/15'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Vision Scan
              </button>
              <button
                type="button"
                onClick={() => { setScannerMode('barcode'); setError(null); }}
                className={`py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  scannerMode === 'barcode'
                    ? 'bg-orange-600 text-black shadow-lg shadow-orange-500/15'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                Barcode Scanner
              </button>
            </div>

            {scannerMode === 'camera' ? (
              <>
                {/* Hidden native input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload Zone / Preview Stage */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 relative overflow-hidden min-h-[240px] ${
                    previewUrl 
                      ? 'border-orange-500 bg-orange-500/[0.02]' 
                      : 'border-zinc-800 bg-zinc-900/10'
                  }`}
                >
                  {previewUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      <img 
                        src={previewUrl} 
                        alt="Meal preview" 
                        className="w-full h-full object-cover opacity-80"
                      />
                      {loading && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                          {/* Interactive cyberpunk visual scanning laser */}
                          <motion.div 
                            initial={{ y: -100 }}
                            animate={{ y: 220 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-lg shadow-orange-500/50 z-20"
                          />
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                          <p className="text-xs font-mono font-bold text-orange-400 text-center animate-pulse uppercase max-w-[240px]">
                            {scanningStep}
                          </p>
                        </div>
                      )}
                      {!loading && (
                        <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/90 border border-zinc-800 rounded-lg p-2 flex items-center justify-between text-[10px] font-mono backdrop-blur-md">
                          <span className="text-zinc-400 truncate max-w-[150px]">{selectedFile?.name || "Demo Food Image"}</span>
                          <span className="text-orange-500 font-bold hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); triggerUpload(); }}>REPLACE</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between gap-5">
                      <div 
                        onClick={!loading ? triggerUpload : undefined}
                        className="flex-1 cursor-pointer group flex flex-col items-center justify-center"
                      >
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto text-zinc-400 group-hover:text-orange-500 group-hover:border-orange-500/40 transition-colors mb-2">
                          <Camera className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold font-mono tracking-tight text-zinc-300 uppercase">
                          Tap to open native camera
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-[220px] mx-auto text-center">
                          Will open mobile lens instantly or let you drop a file from desktop storage
                        </p>
                      </div>

                      <div className="border-t border-zinc-900/80 pt-3 flex flex-col items-center">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">No food near you right now?</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleTryDemoMeal(); }}
                          disabled={loading}
                          className="w-full sm:w-auto px-5 py-2 bg-orange-600 hover:bg-orange-500 text-black font-mono font-bold rounded-lg text-[10px] tracking-wider uppercase transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-black" />
                          TRY DEMO MEAL
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-6 space-y-3">
                  {previewUrl && !loading && (
                    <button
                      onClick={handleScan}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-black font-mono font-bold py-2.5 rounded-lg text-xs transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                    >
                      <Sparkles className="w-4 h-4 fill-black" />
                      TRIGGER NUTRITIONAL TELEMETRY SCAN
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Barcode Scanner UI block */
              <div className="space-y-6">
                {loading && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[180px]">
                    <motion.div 
                      initial={{ y: -80 }}
                      animate={{ y: 160 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-lg shadow-orange-500/50 z-20"
                    />
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                    <p className="text-xs font-mono font-bold text-orange-400 animate-pulse uppercase">
                      {scanningStep}
                    </p>
                  </div>
                )}

                {!loading && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Input Barcode Value</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="Enter barcode (e.g., 8901262010115)"
                          className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleBarcodeScan(barcodeInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleBarcodeScan(barcodeInput)}
                          disabled={!barcodeInput.trim()}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-mono font-bold text-[10px] uppercase rounded-lg tracking-wider transition-all duration-150 transform active:scale-95 cursor-pointer shadow-md"
                        >
                          SCAN
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-900/80">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Interactive Simulation Presets</span>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBarcodeInput("8901262010115");
                            handleBarcodeScan("8901262010115");
                          }}
                          className="p-3 bg-zinc-900/40 border border-zinc-900 hover:border-orange-500/20 hover:bg-zinc-900/80 rounded-lg text-left transition-all font-mono flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-zinc-200 block">Amul Pasteurized Butter</span>
                            <span className="text-[9px] text-zinc-500">Barcode: 8901262010115 · India</span>
                          </div>
                          <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/10 px-2 py-0.5 rounded font-mono">720 kcal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBarcodeInput("044000032029");
                            handleBarcodeScan("044000032029");
                          }}
                          className="p-3 bg-zinc-900/40 border border-zinc-900 hover:border-orange-500/20 hover:bg-zinc-900/80 rounded-lg text-left transition-all font-mono flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-zinc-200 block">Oreo Cookies Global Pack</span>
                            <span className="text-[9px] text-zinc-500">Barcode: 044000032029 · Global</span>
                          </div>
                          <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/10 px-2 py-0.5 rounded font-mono">140 kcal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBarcodeInput("021000010830");
                            handleBarcodeScan("021000010830");
                          }}
                          className="p-3 bg-zinc-900/40 border border-zinc-900 hover:border-orange-500/20 hover:bg-zinc-900/80 rounded-lg text-left transition-all font-mono flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-zinc-200 block">Tropicana 100% Orange Juice</span>
                            <span className="text-[9px] text-zinc-500">Barcode: 021000010830 · Fluid (240ml)</span>
                          </div>
                          <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded font-mono">110 kcal</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error banner shared below */}
            {error && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 flex gap-2.5 text-[10px] font-mono mt-4">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-zinc-400 leading-normal">{error}</span>
              </div>
            )}

          </div>
        </div>

        {/* Right Card: Result metrics & macro breakout chart (takes 7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden" id="macro-dashboard-panel">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/5 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Macronutrient Dashboard
                </h3>
                <p className="text-[11px] text-zinc-500">Live caloric breakdown and ratios of scanned meal</p>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">CRAFTED FOR MUSCLE TARGETING</span>
            </div>

            {latestScan ? (
              <div className="space-y-6">
                
                {/* Result Title */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Scanned Item</span>
                    <h4 className="text-base font-bold text-white font-sans mt-0.5">{latestScan.food_name}</h4>
                    <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
                      SCANNED AT: {new Date(latestScan.scanned_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right shrink-0 bg-orange-500/5 px-4 py-2 border border-orange-500/10 rounded-lg">
                    <span className="text-[9px] font-mono text-orange-400 block uppercase">Estimated Energy</span>
                    <span className="text-2xl font-bold font-mono text-white leading-tight">{latestScan.calories}</span>
                    <span className="text-[10px] font-mono text-zinc-400 ml-1">kcal</span>
                  </div>
                </div>

                {/* Macro Ratios progress bars */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">Macronutrient Weight Breakdown</h5>
                  
                  <div className="space-y-3">
                    
                    {/* Protein Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-mono text-orange-400 font-bold">Protein</span>
                        <div className="font-mono">
                          <span className="text-white font-bold">
                            {unit === 'imperial' ? (latestScan.protein * 0.035274).toFixed(2) : latestScan.protein.toFixed(1)}
                          </span>
                          <span className="text-zinc-500 text-[10px] ml-0.5">{unit === 'imperial' ? 'oz' : 'g'} ({(latestScan.protein * 4).toFixed(0)} kcal)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((latestScan.protein / targets.protein) * 100, 100)}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-orange-500 rounded-full" 
                        />
                      </div>
                    </div>

                    {/* Carbohydrates Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-mono text-zinc-300 font-bold">Carbohydrates</span>
                        <div className="font-mono">
                          <span className="text-white font-bold">
                            {unit === 'imperial' ? (latestScan.carbs * 0.035274).toFixed(2) : latestScan.carbs.toFixed(1)}
                          </span>
                          <span className="text-zinc-500 text-[10px] ml-0.5">{unit === 'imperial' ? 'oz' : 'g'} ({(latestScan.carbs * 4).toFixed(0)} kcal)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((latestScan.carbs / targets.carbs) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className="h-full bg-zinc-300 rounded-full" 
                        />
                      </div>
                    </div>

                    {/* Fats Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-mono text-zinc-500 font-bold">Fats</span>
                        <div className="font-mono">
                          <span className="text-white font-bold">
                            {unit === 'imperial' ? (latestScan.fats * 0.035274).toFixed(2) : latestScan.fats.toFixed(1)}
                          </span>
                          <span className="text-zinc-500 text-[10px] ml-0.5">{unit === 'imperial' ? 'oz' : 'g'} ({(latestScan.fats * 9).toFixed(0)} kcal)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((latestScan.fats / targets.fats) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-zinc-500 rounded-full" 
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Energy ratio chart visualization */}
                <div className="pt-4 border-t border-zinc-900">
                  <h5 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-3">Relative Caloric Contribution (%)</h5>
                  <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex">
                    {(() => {
                      const pKcal = latestScan.protein * 4;
                      const cKcal = latestScan.carbs * 4;
                      const fKcal = latestScan.fats * 9;
                      const totalKcal = pKcal + cKcal + fKcal || 1;
                      
                      const pPct = (pKcal / totalKcal) * 100;
                      const cPct = (cKcal / totalKcal) * 100;
                      const fPct = (fKcal / totalKcal) * 100;

                      return (
                        <>
                          <div style={{ width: `${pPct}%` }} className="h-full bg-orange-500 hover:opacity-90 transition-opacity" title={`Protein: ${pPct.toFixed(0)}%`} />
                          <div style={{ width: `${cPct}%` }} className="h-full bg-zinc-300 hover:opacity-90 transition-opacity" title={`Carbs: ${cPct.toFixed(0)}%`} />
                          <div style={{ width: `${fPct}%` }} className="h-full bg-zinc-500 hover:opacity-90 transition-opacity" title={`Fats: ${fPct.toFixed(0)}%`} />
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-orange-500 block" />
                      <span>PROTEIN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-zinc-300 block" />
                      <span>CARBS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-zinc-500 block" />
                      <span>FATS</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-center text-zinc-500 border border-zinc-900 rounded-xl bg-zinc-900/10">
                <Apple className="w-10 h-10 text-zinc-700 stroke-1 mb-3" />
                <p className="text-xs font-mono">No scanning output selected.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Please upload/scan a meal to populate telemetry.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 3. History logs list */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden" id="nutrition-history-timeline">
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-orange-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900 mb-6">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-tight">
              <Apple className="w-4 h-4 text-orange-500" />
              Vision Scanning Timeline
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Historical food logs & macro estimates</p>
          </div>
          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-mono font-bold text-zinc-500 hover:text-orange-500 flex items-center gap-1.5 border border-zinc-800 hover:border-orange-500/30 px-2.5 py-1 rounded transition-all duration-200"
            >
              <RotateCcw className="w-3 h-3" />
              PURGE LOGS
            </button>
          )}
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Meal Name</th>
                  <th className="py-3 px-4 font-normal">Calories</th>
                  <th className="py-3 px-4 font-normal text-orange-400">Protein</th>
                  <th className="py-3 px-4 font-normal text-zinc-300">Carbs</th>
                  <th className="py-3 px-4 font-normal text-zinc-500">Fats</th>
                  <th className="py-3 px-4 font-normal">Logged At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50 text-xs font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-sans text-white font-bold">{log.food_name}</td>
                    <td className="py-3 px-4 font-bold text-white">{log.calories} kcal</td>
                    <td className="py-3 px-4 font-bold text-orange-400">{formatWeight(log.protein)}</td>
                    <td className="py-3 px-4 text-zinc-300">{formatWeight(log.carbs)}</td>
                    <td className="py-3 px-4 text-zinc-500">{formatWeight(log.fats)}</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {new Date(log.scanned_at).toLocaleDateString()} {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-zinc-500 hover:text-orange-500 transition-colors p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-900 rounded-xl bg-zinc-900/5">
            <Sparkles className="w-8 h-8 text-zinc-800 mx-auto stroke-1 mb-2 animate-pulse" />
            <p className="text-xs text-zinc-500 font-mono">Vision food logs table empty.</p>
            <p className="text-[10px] text-zinc-600 font-mono mt-1">Ready to sync cloud logs on scan triggers.</p>
          </div>
        )}

      </div>

    </div>
  );
}
