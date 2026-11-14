/**
 * Format currency in Indian Rupees or Lakhs
 */
export const formatLPA = (amount) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${amount.toFixed(1)} LPA`;
};

/**
 * Format standard date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format relative deadline (e.g. "in 3 days" or "Closed")
 */
export const getDeadlineStatus = (deadlineString) => {
  if (!deadlineString) return { text: 'No deadline', isUrgent: false, isClosed: false };
  const deadline = new Date(deadlineString);
  const now = new Date();
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Deadline passed', isUrgent: false, isClosed: true };
  } else if (diffDays === 0) {
    return { text: 'Ends today', isUrgent: true, isClosed: false };
  } else if (diffDays <= 3) {
    return { text: `${diffDays} days left`, isUrgent: true, isClosed: false };
  }
  return { text: `${diffDays} days remaining`, isUrgent: false, isClosed: false };
};

/**
 * Status color mappings for badges
 */
export const getStatusColor = (status) => {
  const map = {
    // Placement Drive statuses
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
    Published: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
    Closed: 'bg-stone-100 text-stone-700 border-stone-200',
    Completed: 'bg-slate-100 text-slate-700 border-slate-200',
    Upcoming: 'bg-slate-100 text-slate-800 border-slate-200',
    Ongoing: 'bg-stone-100 text-stone-700 border-stone-200',
    Cancelled: 'bg-stone-100 text-stone-600 border-stone-200',

    // Application statuses
    Applied: 'bg-slate-100 text-slate-700 border-slate-200',
    'Under Review': 'bg-slate-100 text-slate-800 border-slate-200',
    Shortlisted: 'bg-slate-200 text-slate-900 border-slate-300 font-medium',
    Interviewing: 'bg-stone-100 text-stone-800 border-stone-200',
    Selected: 'bg-slate-900 text-white border-slate-900 font-medium',
    Rejected: 'bg-stone-100 text-stone-600 border-stone-200',

    // Placement status
    Placed: 'bg-slate-900 text-white border-slate-900 font-medium',
    'Not Placed': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

