import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <div className="py-10">
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="Страница не найдена"
        description="Проверьте адрес или вернитесь к списку объектов."
      />
      <p className="mt-4 text-center">
        <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          К объектам
        </Link>
      </p>
    </div>
  );
}
