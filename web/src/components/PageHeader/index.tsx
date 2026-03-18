import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="my-6">
      <h1 className="text-4xl font-bold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};