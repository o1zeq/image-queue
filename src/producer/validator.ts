import type { ImagePayload } from '@/shared/types.ts'

const MAX_BASE64_SIZE_BYTES = 190 * 1024 // 190 KB

export function validateImageProducerPayload(body: string | null): {
  errors: string[]
  payload?: ImagePayload
} {
  const errors: string[] = []

  if (!body) {
    errors.push('O corpo da requisição não pode ser vazio.')
    return { errors }
  }

  let data: any
  try {
    data = JSON.parse(body)
  } catch (error) {
    errors.push('O corpo da requisição não é um JSON válido.')
    return { errors }
  }

  const { fileContent, fileName, bucket, path } = data

  if (!fileContent || typeof fileContent !== 'string') {
    errors.push("O campo 'fileContent' (string base64) é obrigatório.")
  } else {
    // Valida o tamanho para não exceder o limite do SQS
    const buffer = Buffer.from(fileContent, 'base64')
    if (buffer.length > MAX_BASE64_SIZE_BYTES) {
      errors.push(
        `O arquivo é muito grande (maior que ${MAX_BASE64_SIZE_BYTES / 1024} KB). O upload deve ser feito por outro método.`,
      )
    }
  }

  if (!fileName || typeof fileName !== 'string') {
    errors.push("O campo 'fileName' é obrigatório.")
  }

  if (!bucket || typeof bucket !== 'string') {
    errors.push("O campo 'bucket' é obrigatório.")
  }

  if (typeof path !== 'string') {
    // path pode ser uma string vazia ""
    errors.push("O campo 'path' deve ser uma string.")
  }

  if (errors.length > 0) {
    return { errors }
  }

  return { errors: [], payload: { fileContent, fileName, bucket, path } }
}
