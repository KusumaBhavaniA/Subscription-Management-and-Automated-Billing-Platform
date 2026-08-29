import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className={`w-full text-left text-xs border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <thead
      className={`border-b border-border bg-tableHeader text-mutedText text-[11px] uppercase tracking-wider font-bold select-none ${className}`}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <tbody className={`divide-y divide-border ${className}`}>{children}</tbody>;
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}> = ({ children, className = '', onClick, selected = false }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-150 ${
        selected ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-tableHover'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ children, className = '', align = 'left' }) => {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`py-3 px-4 font-bold ${alignClass} ${className}`}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  isCurrency?: boolean;
}> = ({ children, className = '', align = 'left', isCurrency = false }) => {
  const alignClass =
    align === 'right' || isCurrency
      ? 'text-right'
      : align === 'center'
      ? 'text-center'
      : 'text-left';
  return (
    <td
      className={`py-3 px-4 text-primaryText font-medium ${
        isCurrency ? 'font-mono font-bold' : ''
      } ${alignClass} ${className}`}
    >
      {children}
    </td>
  );
};
