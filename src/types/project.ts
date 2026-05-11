export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Concluído'

export interface AdminComment {
  id: string
  text: string
  createdAt: string
  createdById: string
  createdByName: string
  userReadAt?: string
  userReply?: {
    text: string
    createdAt: string
    createdById: string
    createdByName: string
  }
}

export interface ProjectTask {
  id: number
  ownerId: string
  ownerName: string
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
  adminComment: AdminComment | null
}

export type ProjectTaskInput = Omit<
  ProjectTask,
  'id' | 'ownerId' | 'ownerName' | 'adminComment'
>
