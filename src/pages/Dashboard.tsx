import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Table,
  Calendar,
  ChevronDown,
  Clock,
  Download
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  format,
  parseISO
} from 'date-fns';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TimeRange = 'day' | 'week' | 'month' | 'ytd';
type ViewMode = 'chart' | 'spreadsheet';

interface TaskHistory {
  id: string;
  task_id: string;
  start_date: string;
  elapsed_time: string;
  task: {
    name: string;
  };
}

interface TimeEntry {
  date: string;
  hours: number;
  minutes: number;
  tasks: {
    name: string;
    hours: number;
    minutes: number;
  }[];
}

const parseElapsedTime = (interval: string): { hours: number, minutes: number } => {
  if (!interval) return { hours: 0, minutes: 0 };
  
  if (interval.includes(':')) {
    const [hours = 0, minutes = 0] = interval.split(':').map(Number);
    return { hours, minutes };
  }
  
  let totalMinutes = 0;
  
  const hoursMatch = interval.match(/(\d+)\s*hours?/);
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
  
  const minsMatch = interval.match(/(\d+)\s*mins?/);
  if (minsMatch) totalMinutes += parseInt(minsMatch[1]);
  
  const secsMatch = interval.match(/(\d+)\s*secs?/);
  if (secsMatch) totalMinutes += Math.round(parseInt(secsMatch[1]) / 60);
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
};

export function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewModeOpen, setIsViewModeOpen] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [topTasks, setTopTasks] = useState<{ name: string; hours: number; minutes: number }[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const viewModeRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (viewModeRef.current && !viewModeRef.current.contains(event.target as Node)) {
        setIsViewModeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTaskHistory = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          navigate('/signin');
          return;
        }

        const dateRange = getDateRange();
        
        const { data, error } = await supabase
          .from('task_history')
          .select(`
            id,
            task_id,
            start_date,
            elapsed_time,
            task:tasks(name)
          `)
          .eq('user_id', user.user.id)
          .gte('start_date', dateRange.start.toISOString().split('T')[0])
          .lte('start_date', dateRange.end.toISOString().split('T')[0])
          .order('start_date', { ascending: true });

        if (error) throw error;
        setTaskHistory(data || []);
        processTaskData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch task history');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskHistory();
  }, [navigate, timeRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'ytd':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        };
    }
  };

  const processTaskData = (historyData: TaskHistory[]) => {
    const entries: { [key: string]: TimeEntry } = {};
    const taskTotals: { [key: string]: { hours: number, minutes: number } } = {};
    let totalTimeHours = 0;
    let totalTimeMinutes = 0;

    historyData.forEach(history => {
      const dateStr = history.start_date;
      const { hours, minutes } = parseElapsedTime(history.elapsed_time);
      const taskName = history.task.name;

      if (!taskTotals[taskName]) {
        taskTotals[taskName] = { hours: 0, minutes: 0 };
      }
      taskTotals[taskName].hours += hours;
      taskTotals[taskName].minutes += minutes;

      if (taskTotals[taskName].minutes >= 60) {
        taskTotals[taskName].hours += Math.floor(taskTotals[taskName].minutes / 60);
        taskTotals[taskName].minutes %= 60;
      }

      totalTimeHours += hours;
      totalTimeMinutes += minutes;

      if (!entries[dateStr]) {
        entries[dateStr] = {
          date: dateStr,
          hours: 0,
          minutes: 0,
          tasks: []
        };
      }

      entries[dateStr].hours += hours;
      entries[dateStr].minutes += minutes;

      if (entries[dateStr].minutes >= 60) {
        entries[dateStr].hours += Math.floor(entries[dateStr].minutes / 60);
        entries[dateStr].minutes %= 60;
      }
      
      const existingTask = entries[dateStr].tasks.find(t => t.name === taskName);
      if (existingTask) {
        existingTask.hours += hours;
        existingTask.minutes += minutes;
        if (existingTask.minutes >= 60) {
          existingTask.hours += Math.floor(existingTask.minutes / 60);
          existingTask.minutes %= 60;
        }
      } else {
        entries[dateStr].tasks.push({
          name: taskName,
          hours,
          minutes
        });
      }
    });

    if (totalTimeMinutes >= 60) {
      totalTimeHours += Math.floor(totalTimeMinutes / 60);
      totalTimeMinutes %= 60;
    }

    const sortedTasks = Object.entries(taskTotals)
      .sort(([, a], [, b]) => (b.hours * 60 + b.minutes) - (a.hours * 60 + a.minutes))
      .slice(0, 5)
      .map(([name, time]) => ({ 
        name, 
        hours: time.hours, 
        minutes: time.minutes 
      }));

    setTopTasks(sortedTasks);
    setTotalHours(totalTimeHours);
    setTotalMinutes(totalTimeMinutes);
    setTimeEntries(Object.values(entries).sort((a, b) => a.date.localeCompare(b.date)));
  };

  const formatTime = (hours: number, minutes: number): string => {
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setIsFilterOpen(false);
  };

  const chartData = {
    labels: timeEntries.map(entry => format(parseISO(entry.date), 'MMM d')),
    datasets: [
      {
        label: 'Hours',
        data: timeEntries.map(entry => Number((entry.hours + (entry.minutes / 60)).toFixed(2))),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Time Spent on Tasks',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
    },
  };

  const handleDownloadPDF = async () => {
    if (!chartRef.current || downloading) return;
    
    try {
      setDownloading(true);
      
      const reportContent = document.createElement('div');
      reportContent.style.padding = '20px';
      reportContent.style.background = 'white';
      reportContent.style.width = '800px';
      
      const title = document.createElement('h1');
      title.style.fontSize = '24px';
      title.style.marginBottom = '20px';
      title.style.color = '#1f2937';
      title.textContent = `Task Time Report (${timeRange.toUpperCase()})`;
      reportContent.appendChild(title);
      
      const summary = document.createElement('div');
      summary.style.marginBottom = '30px';
      summary.innerHTML = `
        <h2 style="font-size: 18px; margin-bottom: 10px; color: #374151;">Summary</h2>
        <p style="margin-bottom: 5px;">Total Time: ${formatTime(totalHours, totalMinutes)}</p>
        <p>Period: ${format(getDateRange().start, 'MMM d, yyyy')} - ${format(getDateRange().end, 'MMM d, yyyy')}</p>
      `;
      reportContent.appendChild(summary);
      
      const topTasksSection = document.createElement('div');
      topTasksSection.style.marginBottom = '30px';
      topTasksSection.innerHTML = `
        <h2 style="font-size: 18px; margin-bottom: 10px; color: #374151;">Top Tasks</h2>
        ${topTasks.map(task => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${task.name}</span>
            <span>${formatTime(task.hours, task.minutes)}</span>
          </div>
        `).join('')}
      `;
      reportContent.appendChild(topTasksSection);
      
      const chartCanvas = await html2canvas(chartRef.current, {
        backgroundColor: 'white',
        scale: 2
      });
      
      const chartImage = document.createElement('div');
      chartImage.style.marginBottom = '30px';
      chartImage.appendChild(chartCanvas);
      reportContent.appendChild(chartImage);
      
      document.body.appendChild(reportContent);
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvas = await html2canvas(reportContent, {
        backgroundColor: 'white',
        scale: 2
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgWidth = pdfWidth;
      const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfImgHeight;
      let position = 0;
      let page = 1;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfImgWidth, pdfImgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = -pdfHeight * page;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfImgWidth, pdfImgHeight);
        heightLeft -= pdfHeight;
        page++;
      }
      
      pdf.save(`task-time-report-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      document.body.removeChild(reportContent);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Total Time', 'Tasks'];
    const rows = timeEntries.map(entry => {
      const totalTime = formatTime(entry.hours, entry.minutes);
      const tasks = entry.tasks
        .map(task => `${task.name}: ${formatTime(task.hours, task.minutes)}`)
        .join('; ');
      return [
        format(parseISO(entry.date), 'MMM d, yyyy'),
        totalTime,
        tasks
      ];
    });

    // Add summary row
    rows.push([
      'Total',
      formatTime(totalHours, totalMinutes),
      ''
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `task-time-spreadsheet-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {viewMode === 'chart' ? (
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          ) : (
            <button
              onClick={handleDownloadCSV}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          )}
          
          <div className="relative w-full sm:w-auto" ref={viewModeRef}>
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => setIsViewModeOpen(!isViewModeOpen)}
            >
              {viewMode === 'chart' ? (
                <>
                  <BarChart className="w-4 h-4" />
                  Chart View
                </>
              ) : (
                <>
                  <Table className="w-4 h-4" />
                  Spreadsheet View
                </>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isViewModeOpen ? 'rotate-180' : ''}`} />
            </button>
            {isViewModeOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setViewMode('chart');
                      setIsViewModeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      viewMode === 'chart'
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <BarChart className="w-4 h-4" />
                    Chart View
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('spreadsheet');
                      setIsViewModeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      viewMode === 'spreadsheet'
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    Spreadsheet View
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-auto" ref={filterRef}>
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Calendar className="w-4 h-4" />
              {timeRange.toUpperCase()}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {(['day', 'week', 'month', 'ytd'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => handleTimeRangeChange(range)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        timeRange === range
                          ? 'bg-blue-50  dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Total Time</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatTime(totalHours, totalMinutes)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            in the {timeRange === 'ytd' ? 'year' : timeRange}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Tasks</h2>
          </div>
          <div className="space-y-3">
            {topTasks.length > 0 ? (
              topTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{task.name}</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatTime(task.hours, task.minutes)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No tasks recorded in this period</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {viewMode === 'chart' ? (
          <div ref={chartRef} className="h-[300px] md:h-[400px]">
            {timeEntries.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available for the selected time range</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {timeEntries.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tasks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {timeEntries.map((entry) => (
                    <tr key={entry.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(parseISO(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatTime(entry.hours, entry.minutes)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <ul className="list-disc list-inside">
                          {entry.tasks.map((task, index) => (
                            <li key={index} className="truncate">
                              {task.name}: {formatTime(task.hours, task.minutes)}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No data available for the selected time range</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}