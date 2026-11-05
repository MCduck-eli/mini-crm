import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextField } from './TextField';
import { createObject, updateObject } from '../api/objects';
import { friendlyError } from '../lib/db';
import type { AppObject } from '../types';

interface ObjectFormValues {
  name: string;
  address: string;
}

export function ObjectFormModal({
  object,
  onClose,
  onSaved,
}: {
  object: AppObject | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState } = useForm<ObjectFormValues>({
    defaultValues: { name: object?.name ?? '', address: object?.address ?? '' },
  });

  async function save(values: ObjectFormValues) {
    setSaving(true);
    setError(null);
    try {
      if (object) await updateObject(object.id, values);
      else await createObject(values);
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={object ? 'Редактировать объект' : 'Новый объект'} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(save)}>
        <TextField
          id="object-name"
          label="Название объекта"
          placeholder="ЖК «Северная звезда», корпус 3"
          error={formState.errors.name?.message}
          {...register('name', { required: 'Укажите название объекта' })}
        />
        <TextField
          id="object-address"
          label="Адрес"
          placeholder="г. Москва, ул. Кронштадтская, 14"
          error={formState.errors.address?.message}
          {...register('address', { required: 'Укажите адрес объекта' })}
        />
        {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={saving}>
            {object ? 'Сохранить' : 'Создать объект'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
