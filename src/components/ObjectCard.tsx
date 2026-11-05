import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppObject, Task } from '../types';

export function ObjectCard({ object, tasks, index = 0 }: { object: AppObject; tasks: Task[]; index?: number }) {
  const open = tasks.filter((task) => task.status !== 'Принята').length;
  const accepted = tasks.length - open;

  return (
    <Link
      to={`/objects/${object.id}`}
      className="rise block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <h3 className="text-base font-semibold text-slate-900">{object.name}</h3>
      <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {object.address}
      </p>
      <div className="mt-4 flex gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">Задач: {tasks.length}</span>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">В работе: {open}</span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">Принято: {accepted}</span>
      </div>
    </Link>
  );
}
