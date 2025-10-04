import { useState, useEffect } from "react";

export interface DailyTask {
  id: number;
  type: string;
  adsgramBlockId?: string;
  reward: number;
}

export const useDailyTasks = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Replace with your API call
        const res = await fetch("/daily-tasks/incomplete");
        const data: DailyTask[] = await res.json();

        // only keep adsgram tasks
        const adsgramTasks = data.filter(t => t.type === "adsgram");
        setTasks(adsgramTasks);
      } catch (err) {
        console.error("Failed to fetch daily tasks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, loading };
};
