'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Droplets,
  Trash2,
  X,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Apple,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { MealType } from '@/types/database';

interface NutritionDay {
  id: string;
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  water_ml: number;
}

interface MealEntry {
  id: string;
  meal_type: MealType;
  name: string;
  foods: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

interface WeeklyPoint {
  date: string;
  calories: number;
  protein: number;
  target: number;
}

interface NutritionTrackerProps {
  nutritionDay: NutritionDay;
  meals: MealEntry[];
  weeklyData: WeeklyPoint[];
  today: string;
}

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  snack: <Apple className="h-4 w-4" />,
  lunch: <Sun className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  snack: 'Snack',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const MEAL_ORDER: MealType[] = ['breakfast', 'snack', 'lunch', 'dinner'];

export function NutritionTracker({ nutritionDay, meals, weeklyData, today }: NutritionTrackerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [addingMeal, setAddingMeal] = useState<MealType | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealFoods, setMealFoods] = useState('');
  const [mealCals, setMealCals] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [waterAdding, setWaterAdding] = useState(false);

  // Totals
  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);

  const calPct = Math.min(100, Math.round((totalCalories / (nutritionDay.calorie_target || 2500)) * 100));
  const proteinPct = Math.min(100, Math.round((totalProtein / (nutritionDay.protein_target || 150)) * 100));
  const carbPct = Math.min(100, Math.round((totalCarbs / (nutritionDay.carb_target || 250)) * 100));
  const fatPct = Math.min(100, Math.round((totalFat / (nutritionDay.fat_target || 85)) * 100));

  const waterCups = Math.round((nutritionDay.water_ml || 0) / 250); // ~250ml per cup
  const waterTarget = 8; // cups

  function resetForm() {
    setMealName('');
    setMealFoods('');
    setMealCals('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setAddingMeal(null);
  }

  async function handleAddMeal() {
    if (!addingMeal || !mealName) return;
    setSaving(true);

    await supabase.from('meals').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      nutrition_day_id: nutritionDay.id,
      meal_type: addingMeal,
      name: mealName,
      foods: mealFoods || null,
      calories: Number(mealCals) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
      source: 'manual',
    });

    resetForm();
    setSaving(false);
    router.refresh();
  }

  async function handleDeleteMeal(mealId: string) {
    await supabase.from('meals').delete().eq('id', mealId);
    router.refresh();
  }

  async function handleAddWater(ml: number) {
    setWaterAdding(true);
    await supabase.from('nutrition_days').update({
      water_ml: (nutritionDay.water_ml || 0) + ml,
    }).eq('id', nutritionDay.id);
    setWaterAdding(false);
    router.refresh();
  }

  // Group meals by type
  const mealsByType: Record<MealType, MealEntry[]> = {
    breakfast: [],
    snack: [],
    lunch: [],
    dinner: [],
  };
  for (const meal of meals) {
    mealsByType[meal.meal_type]?.push(meal);
  }

  const maxWeeklyCals = Math.max(1, ...weeklyData.map((d) => Math.max(d.calories, d.target)));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Nutrition</h1>
        <p className="text-sm text-[#6b6b80] mt-1">
          {new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Macro Overview Ring */}
      <Card>
        <div className="flex items-center gap-6">
          {/* Calorie ring */}
          <div className="relative flex-shrink-0">
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#2a2a3a" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none" stroke="#00E5CC" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - calPct / 100)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{totalCalories}</span>
              <span className="text-[9px] text-[#6b6b80] uppercase tracking-[1px]">
                / {nutritionDay.calorie_target} cal
              </span>
            </div>
          </div>

          {/* Macro bars */}
          <div className="flex-1 space-y-3">
            <MacroBar label="Protein" current={totalProtein} target={nutritionDay.protein_target} unit="g" color="#00E5CC" pct={proteinPct} />
            <MacroBar label="Carbs" current={totalCarbs} target={nutritionDay.carb_target} unit="g" color="#00d2ff" pct={carbPct} />
            <MacroBar label="Fat" current={totalFat} target={nutritionDay.fat_target} unit="g" color="#ffab00" pct={fatPct} />
          </div>
        </div>
      </Card>

      {/* Water Tracker */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-[#00d2ff]" />
            <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">Water</h3>
          </div>
          <span className="text-sm text-[#a0a0b8]">{waterCups} / {waterTarget} cups</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: waterTarget }).map((_, i) => (
            <div
              key={i}
              className={`h-8 flex-1 rounded-lg transition-colors ${
                i < waterCups ? 'bg-[#00d2ff]/20 border border-[#00d2ff]/40' : 'bg-[#1a1a25] border border-[#2a2a3a]'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleAddWater(250)} loading={waterAdding} className="gap-1">
            <Plus className="h-3 w-3" /> 1 cup
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddWater(500)} loading={waterAdding} className="gap-1">
            <Plus className="h-3 w-3" /> 2 cups
          </Button>
        </div>
      </Card>

      {/* Meals by Type */}
      {MEAL_ORDER.map((type) => (
        <Card key={type}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#00E5CC]">{MEAL_ICONS[type]}</span>
              <h3 className="text-sm font-semibold text-white">{MEAL_LABELS[type]}</h3>
              {mealsByType[type].length > 0 && (
                <span className="text-xs text-[#6b6b80]">
                  {mealsByType[type].reduce((s, m) => s + m.calories, 0)} cal
                </span>
              )}
            </div>
            <button
              onClick={() => setAddingMeal(addingMeal === type ? null : type)}
              className="text-[#00E5CC] hover:text-[#00CCBB] transition-colors cursor-pointer"
            >
              {addingMeal === type ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>

          {/* Existing meals */}
          {mealsByType[type].length > 0 && (
            <div className="space-y-2 mb-3">
              {mealsByType[type].map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{meal.name}</p>
                    {meal.foods && (
                      <p className="text-[11px] text-[#6b6b80] truncate">{meal.foods}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{meal.calories}</p>
                      <p className="text-[10px] text-[#6b6b80]">cal</p>
                    </div>
                    <div className="flex gap-2 text-[10px] text-[#6b6b80]">
                      <span>P:{meal.protein}</span>
                      <span>C:{meal.carbs}</span>
                      <span>F:{meal.fat}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-[#4a4a5a] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add meal form */}
          {addingMeal === type && (
            <div className="rounded-xl border border-[#00E5CC]/20 bg-[#00E5CC]/5 p-4 space-y-3">
              <input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="Meal name (e.g. Grilled Chicken Salad)"
                className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
              />
              <input
                value={mealFoods}
                onChange={(e) => setMealFoods(e.target.value)}
                placeholder="Foods (optional — e.g. chicken, lettuce, tomato)"
                className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
              />
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[9px] text-[#6b6b80] uppercase mb-1">Calories</label>
                  <input
                    type="number"
                    value={mealCals}
                    onChange={(e) => setMealCals(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[#6b6b80] uppercase mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={mealProtein}
                    onChange={(e) => setMealProtein(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[#6b6b80] uppercase mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={mealCarbs}
                    onChange={(e) => setMealCarbs(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[#6b6b80] uppercase mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={mealFat}
                    onChange={(e) => setMealFat(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={resetForm}>Cancel</Button>
                <Button size="sm" onClick={handleAddMeal} loading={saving} disabled={!mealName}>
                  Add Meal
                </Button>
              </div>
            </div>
          )}

          {/* Empty state for meal type */}
          {mealsByType[type].length === 0 && addingMeal !== type && (
            <p className="text-xs text-[#4a4a5a] italic">No {MEAL_LABELS[type].toLowerCase()} logged</p>
          )}
        </Card>
      ))}

      {/* Weekly Overview */}
      <Card>
        <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px] mb-4">
          Weekly Calories
        </h3>
        <div className="flex items-end gap-2 h-[120px]">
          {weeklyData.map((d, i) => {
            const isToday = i === weeklyData.length - 1;
            const barHeight = Math.max(4, (d.calories / maxWeeklyCals) * 100);
            const targetHeight = Math.max(4, (d.target / maxWeeklyCals) * 100);
            const overTarget = d.calories > d.target;

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full h-[100px] flex items-end justify-center">
                  {/* Target line */}
                  <div
                    className="absolute w-full border-t border-dashed border-[#2a2a3a]"
                    style={{ bottom: `${targetHeight}%` }}
                  />
                  {/* Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${
                      isToday
                        ? overTarget ? 'bg-[#ffab00]' : 'bg-[#00E5CC]'
                        : overTarget ? 'bg-[#ffab00]/50' : 'bg-[#00E5CC]/40'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span className={`text-[10px] ${isToday ? 'text-white font-semibold' : 'text-[#6b6b80]'}`}>
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-[#6b6b80]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00E5CC]" /> Under target</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ffab00]" /> Over target</span>
          <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-[#6b6b80]" /> Target</span>
        </div>
      </Card>
    </div>
  );
}

function MacroBar({
  label,
  current,
  target,
  unit,
  color,
  pct,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#a0a0b8]">{label}</span>
        <span className="text-xs text-[#6b6b80]">
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#2a2a3a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
