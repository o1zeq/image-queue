import type { ImagePayload } from '@/shared/types.ts'

export function validateImageConsumerMessage(body: string | undefined): {
  errors: string[]
  payload?: ImagePayload
} {
  const errors: string[] = []

  if (!body) {
    errors.push('O corpo da mensagem da SQS está vazio.')
    return { errors }
  }

  let data: any
  try {
    data = JSON.parse(body)
  } catch (error) {
    errors.push('O corpo da mensagem não é um JSON válido.')
    return { errors }
  }

  const { fileContent, fileName, bucket, path } = data

  if (!fileContent || typeof fileContent !== 'string') {
    errors.push("O campo 'fileContent' está ausente ou não é uma string.")
  }

  if (!fileName || typeof fileName !== 'string') {
    errors.push("O campo 'fileName' está ausente ou não é uma string.")
  }

  if (!bucket || typeof bucket !== 'string') {
    errors.push("O campo 'bucket' está ausente ou não é uma string.")
  }

  if (typeof path !== 'string') {
    errors.push("O campo 'path' deve ser uma string.")
  }

  if (errors.length > 0) {
    return { errors }
  }

  return { errors: [], payload: { fileContent, fileName, bucket, path } }
}
