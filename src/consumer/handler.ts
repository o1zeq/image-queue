import type { SQSEvent, SQSRecord } from 'aws-lambda'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { validateImageConsumerMessage } from '@/consumer/validator.ts'

const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  throw new Error('Variável de ambiente AWS_REGION não definida.')
}

const s3Client = new S3Client({ region: AWS_REGION })

const processMessage = async (record: SQSRecord): Promise<void> => {
  console.log(`Processando mensagem de upload ID: ${record.messageId}`)

  const { errors, payload } = validateImageConsumerMessage(record.body)

  if (errors.length > 0) {
    console.error(`Mensagem de upload inválida [ID: ${record.messageId}]:`, {
      errors,
    })

    return
  }

  const { fileContent, fileName, bucket, path } = payload!

  const finalPath = path.endsWith('/') ? path : `${path}/`
  const key = path ? `${finalPath}${fileName}` : fileName

  const fileBuffer = Buffer.from(fileContent, 'base64')

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
  })

  try {
    console.log(`Fazendo upload de '${key}' para o bucket '${bucket}'...`)
    await s3Client.send(command)
    console.log(`Ficheiro '${key}' enviado com sucesso para o S3.`)
  } catch (error) {
    console.error(`Falha ao enviar ficheiro para o S3 ('${key}'):`, error)
    // Lançar o erro novamente faz com que o SQS tente re-processar a mensagem
    throw error
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(
    `Evento de upload SQS recebido com ${event.Records.length} registro(s).`,
  )

  const processingPromises = event.Records.map(processMessage)

  await Promise.allSettled(processingPromises)
}
