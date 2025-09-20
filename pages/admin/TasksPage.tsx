import React, { useState, useEffect } from 'react';
import { createDailyTask, fetchDailyTasks, deleteDailyTask, updateDailyTaskStatus } from '../../services/api';
import type { DailyTask } from '../../types';
export type CreateDailyTaskDTO = Omit<DailyTask, "id" | "status" | "completions" | "created_at" | "updated_at">;


const TasksPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    reward: '',
    link: '',
    ad_network_id: '',
    category: 'Daily' as 'Daily' | 'Game' | 'Social' | 'Partner',
    taskType: '', // Add this line with empty string as default

  });
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, isError: boolean } | null>(null);

  // Load daily tasks on component mount
  useEffect(() => {
    loadDailyTasks();
  }, []);

  const loadDailyTasks = async () => {
    setIsLoadingList(true);
    try {
      const tasks = await fetchDailyTasks();
      setDailyTasks(tasks);
    } catch (error) {
      console.error('Failed to load daily tasks:', error);
      setFeedback({ message: 'Failed to load daily tasks', isError: true });
    } finally {
      setIsLoadingList(false);
    }
  };

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setFeedback(null);

  try {
    const result = await createDailyTask({
      title: formData.title,
      reward: parseInt(formData.reward, 10),
      link: formData.link,
      ad_network_id: formData.ad_network_id ? parseInt(formData.ad_network_id, 10) : null,
      category: 'Daily',
      task_type: formData.taskType || "AD", // ✅ new field
    });

    if ((result as any).success !== false) {
      setFeedback({ message: 'Daily Task created successfully!', isError: false });
      setFormData({ title: '', reward: '', link: '', ad_network_id: '', category: 'Daily', taskType: '' });
      await loadDailyTasks();
    } else {
      setFeedback({ message: 'Failed to create task.', isError: true });
    }
  } catch (error) {
    setFeedback({ message: 'An error occurred.', isError: true });
  } finally {
    setIsLoading(false);
  }
};





  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const result = await deleteDailyTask(taskId);
      if (result.success) {
        setFeedback({ message: 'Task deleted successfully!', isError: false });
        await loadDailyTasks();
      } else {
        setFeedback({ message: 'Failed to delete task.', isError: true });
      }
    } catch (error) {
      setFeedback({ message: 'Failed to delete task.', isError: true });
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: 'ACTIVE' | 'PAUSED') => {
    try {
      const result = await updateDailyTaskStatus(taskId, newStatus);
      if (result.success) {
        setFeedback({ message: 'Task status updated!', isError: false });
        await loadDailyTasks();
      } else {
        setFeedback({ message: 'Failed to update task status.', isError: true });
      }
    } catch (error) {
      setFeedback({ message: 'Failed to update task status.', isError: true });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'ACTIVE' 
      ? 'bg-green-500 text-green-100' 
      : 'bg-yellow-500 text-yellow-100';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const TASK_TYPES = [
  { value: "AD", label: "AD" },
  { value: "CHANNEL", label: "CHANNEL" },
  { value: "BOT", label: "Bot" },
];



  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white mb-8">Daily Tasks Management</h1>

      {/* Create Task Form */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Daily Task</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Task Title</label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                placeholder="e.g., Watch a video"
              />
            </div>

            <div>
            <label htmlFor="taskType" className="block text-sm font-medium text-slate-300 mb-2">
              Task Type
            </label>
            <select
  id="taskType"
  required
  value={formData.taskType || ''} // Handle undefined case
  onChange={e => setFormData({ ...formData, taskType: e.target.value })}
  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
>
  <option value="" disabled>Select a type</option>
  {TASK_TYPES.map(type => (
    <option key={type.value} value={type.value}>
      {type.label}
    </option>
  ))}
</select>
             </div>


            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-slate-300 mb-2">Coin Reward</label>
              <input
                id="reward"
                type="number"
                required
                value={formData.reward}
                onChange={e => setFormData({ ...formData, reward: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                placeholder="e.g., 500"
              />
            </div>

            <div>
              <label htmlFor="link" className="block text-sm font-medium text-slate-300 mb-2">Task Link</label>
              <input
                id="link"
                type="url"
                
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                placeholder="https://example.com/task"
              />
            </div>

            {/* <div>
              <label htmlFor="ad_network_id" className="block text-sm font-medium text-slate-300 mb-2">Ad Network ID (optional)</label>
              <input
                id="ad_network_id"
                type="number"
                value={formData.ad_network_id}
                onChange={e => setFormData({ ...formData, ad_network_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                placeholder="Ad Network ID"
              />
            </div> */}

            
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-600"
            >
              {isLoading ? 'Creating...' : 'Create Daily Task'}
            </button>
          </div>

          {feedback && (
            <p className={`text-sm text-center font-semibold pt-2 ${feedback.isError ? 'text-red-500' : 'text-green-500'}`}>
              {feedback.message}
            </p>
          )}
        </form>
      </div>

      {/* Daily Tasks List */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Daily Tasks List</h2>
          <button
            onClick={loadDailyTasks}
            disabled={isLoadingList}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-slate-600"
          >
            {isLoadingList ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoadingList ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading tasks...</p>
          </div>
        ) : dailyTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No daily tasks created yet.</p>
            <p className="text-sm mt-2">Create your first daily task above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">Reward</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">Completions</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dailyTasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-700 hover:bg-slate-750">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{task.title}</span>
                        <a 
                          href={task.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 text-sm hover:underline truncate max-w-xs"
                          title={task.link}
                        >
                          {task.link}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-medium">
                      {task.reward.toLocaleString()} coins
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {task.completions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {task.created_at ? formatDate(task.created_at) : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(task.id, task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                          className={`px-3 py-1 rounded text-sm ${
                            task.status === 'ACTIVE' 
                              ? 'bg-yellow-500 hover:bg-yellow-600' 
                              : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                        >
                          {task.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Statistics Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-750 p-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-slate-300">Total Tasks</h3>
            <p className="text-3xl font-bold text-white">{dailyTasks.length}</p>
          </div>
          <div className="bg-slate-750 p-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-slate-300">Active Tasks</h3>
            <p className="text-3xl font-bold text-green-500">
              {dailyTasks.filter(t => t.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-slate-750 p-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-slate-300">Total Completions</h3>
            <p className="text-3xl font-bold text-blue-500">
              {dailyTasks.reduce((sum, task) => sum + task.completions, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;