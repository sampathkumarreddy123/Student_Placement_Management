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
    Draft: 'bg-[#F6F0E8] text-[#82776C] border-[#E8DED2]',
    Published: 'bg-[#F1E7D9] text-[#44352D] border-[#E8DED2] font-medium',
    Closed: 'bg-[#F6F0E8] text-[#82776C] border-[#E8DED2]',
    Completed: 'bg-[#27845B]/10 text-[#27845B] border-[#27845B]/20',
    Upcoming: 'bg-[#F1E7D9] text-[#76543D] border-[#E8DED2]',
    Ongoing: 'bg-[#C58A32]/10 text-[#C58A32] border-[#C58A32]/20',
    Cancelled: 'bg-[#C94C4C]/10 text-[#C94C4C] border-[#C94C4C]/20',
    Active: 'bg-[#27845B]/10 text-[#27845B] border-[#27845B]/20 font-medium',

    // Application statuses
    Applied: 'bg-[#F6F0E8] text-[#76543D] border-[#E8DED2]',
    'Under Review': 'bg-[#F1E7D9] text-[#44352D] border-[#E8DED2]',
    Shortlisted: 'bg-[#C58A32]/10 text-[#C58A32] border-[#C58A32]/20 font-medium',
    Interviewing: 'bg-[#A17C5B]/15 text-[#76543D] border-[#A17C5B]/30 font-medium',
    Selected: 'bg-[#27845B]/10 text-[#27845B] border-[#27845B]/20 font-medium',
    Rejected: 'bg-[#C94C4C]/10 text-[#C94C4C] border-[#C94C4C]/20',

    // Placement status
    Placed: 'bg-[#27845B]/10 text-[#27845B] border-[#27845B]/20 font-semibold',
    'Not Placed': 'bg-[#F6F0E8] text-[#82776C] border-[#E8DED2]',
  };

  return map[status] || 'bg-[#F6F0E8] text-[#44352D] border-[#E8DED2]';
};

