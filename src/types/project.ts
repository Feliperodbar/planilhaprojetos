export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Concluído'

export interface ProjectTask {
  id: number
  solicitante: string
  projeto: string
  atividade: string
  descricao: string
  responsavel: string
  dataInicioPrevisto: string
  dataTerminoPrevisto: string
  dataInicioReal: string
  dataTerminoReal: string
  status: TaskStatus
}

export type ProjectTaskInput = Omit<ProjectTask, 'id'>
