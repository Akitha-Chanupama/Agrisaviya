export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toFixed(2)}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const getRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default {
  formatCurrency,
  formatDate,
  truncateText,
  getRandomId,
  capitalizeFirstLetter,
}; 