import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowRight } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records matching your request right now.',
  actionText,
  actionIcon: ActionIcon = ArrowRight,
  onAction,
  actionTo,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-sm flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm sm:max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actionTo ? (
            <Link to={actionTo}>
              <Button size="sm" icon={ActionIcon}>
                {actionText}
              </Button>
            </Link>
          ) : actionText && onAction ? (
            <Button size="sm" icon={ActionIcon} onClick={onAction}>
              {actionText}
            </Button>
          ) : null}

          {secondaryActionText && onSecondaryAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
