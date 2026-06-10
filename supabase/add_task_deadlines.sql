-- Добавляет дедлайн в существующую базу TaskFlow AI.
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_board_deadline
ON public.tasks (board_id, deadline)
WHERE deadline IS NOT NULL;
