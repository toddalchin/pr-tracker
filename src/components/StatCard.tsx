'use client';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
};

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon,
  change
}: StatCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline space-x-4">
        <p className="text-2xl font-semibold">{value}</p>
        
        {change && (
          <span className={`text-sm font-medium flex items-center ${
            change.isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            <span className="mr-1">
              {change.isPositive ? '↑' : '↓'}
            </span>
            {Math.abs(change.value)}%
          </span>
        )}
      </div>
      
      {description && (
        <p className="mt-1 text-gray-500 text-sm">{description}</p>
      )}
    </div>
  );
} 