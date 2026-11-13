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
    Draft: 'bg-slate-100 text-slate-700 border-slate-300',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Closed: 'bg-rose-50 text-rose-700 border-rose-200',
    Completed: 'bg-purple-50 text-purple-700 border-purple-200',
    Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    Ongoing: 'bg-amber-50 text-amber-700 border-amber-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',

    // Application statuses
    Applied: 'bg-slate-100 text-slate-700 border-slate-300',
    Shortlisted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Interviewing: 'bg-amber-50 text-amber-700 border-amber-200',
    Selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',

    // Placement status
    Placed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Not Placed': 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return map[status] || 'bg-slate-100 text-slate-700 border-slate-300';
};

