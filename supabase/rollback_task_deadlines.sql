-- Откат дедлайнов. ВНИМАНИЕ: удалит все сохранённые дедлайны.
DROP INDEX IF EXISTS public.idx_tasks_board_deadline;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS deadline;
