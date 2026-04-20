import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NutritionTracker } from './nutrition-tracker';

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get today's date in user-local format
  const today = new Date().toISOString().split('T')[0];

  // Get or create today's nutrition day
  const { data: dayId } = await supabase.rpc('get_or_create_nutrition_day', {
    p_user_id: user.id,
    p_date: today,
  });

  // Fetch today's nutrition day record
  const { data: nutritionDay } = await supabase
    .from('nutrition_days')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  // Fetch today's meals
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('nutrition_day_id', nutritionDay?.id || dayId)
    .order('logged_at', { ascending: true });

  // Fetch last 7 days for the weekly trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data: recentDays } = await supabase
    .from('nutrition_days')
    .select('date, calorie_target, water_ml')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Fetch meals for those days
  const recentDayIds = (recentDays || []).map((d: any) => d.id).filter(Boolean);
  const { data: recentMeals } = await supabase
    .from('meals')
    .select('nutrition_day_id, calories, protein, carbs, fat')
    .eq('user_id', user.id)
    .gte('logged_at', sevenDaysAgo.toISOString());

  // Build weekly summary
  const weeklyData: { date: string; calories: number; protein: number; target: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecord = (recentDays || []).find((rd: any) => rd.date === dateStr);

    const dayMeals = (recentMeals || []).filter((m: any) => {
      const mDate = new Date(m.logged_at).toISOString().split('T')[0];
      return mDate === dateStr;
    });

    const totalCals = dayMeals.reduce((s: number, m: any) => s + (m.calories || 0), 0);
    const totalProtein = dayMeals.reduce((s: number, m: any) => s + (m.protein || 0), 0);

    weeklyData.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: totalCals,
      protein: totalProtein,
      target: dayRecord?.calorie_target || 2500,
    });
  }

  return (
    <NutritionTracker
      nutritionDay={nutritionDay || { id: dayId, calorie_target: 2500, protein_target: 150, carb_target: 250, fat_target: 85, water_ml: 0 }}
      meals={meals || []}
      weeklyData={weeklyData}
      today={today}
    />
  );
}
