// Utility functions for formatting time and dates
export const padNumber = (num: number): string => num.toString().padStart(2, '0');

export const millisecondsToInterval = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
};

export const intervalToMilliseconds = (interval: string): number => {
  if (!interval) return 0;
  
  if (interval.includes(':')) {
    const [hours = 0, minutes = 0, seconds = 0] = interval.split(':').map(Number);
    return ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000;
  } else {
    let totalMs = 0;
    
    const hoursMatch = interval.match(/(\d+)\s*hours?/);
    if (hoursMatch) totalMs += parseInt(hoursMatch[1]) * 3600000;
    
    const minsMatch = interval.match(/(\d+)\s*mins?/);
    if (minsMatch) totalMs += parseInt(minsMatch[1]) * 60000;
    
    const secsMatch = interval.match(/(\d+)\s*secs?/);
    if (secsMatch) totalMs += parseInt(secsMatch[1]) * 1000;
    
    return totalMs;
  }
};

export const formatElapsedTime = (interval: string): string => {
  const [hours = 0, minutes = 0] = interval.split(':').map(Number);
  return `${hours}h ${minutes}m`;
};

export const formatDateTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  
  const formattedDate = date.toLocaleDateString();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${formattedDate} ${hours}:${minutes} ${ampm}`;
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'P1':
      return 'text-red-600 dark:text-red-400';
    case 'P2':
      return 'text-orange-600 dark:text-orange-400';
    case 'P3':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'P4':
      return 'text-blue-600 dark:text-blue-400';
    case 'P5':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};