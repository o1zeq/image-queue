import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { validateImageProducerPayload } from '@/producer/validator.ts'

const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  throw new Error('Variável de ambiente AWS_REGION não definida.')
}

const IMAGE_QUEUE_URL = process.env.IMAGE_QUEUE_URL
if (!IMAGE_QUEUE_URL) {
  throw new Error('Variável de ambiente IMAGE_QUEUE_URL não definida.')
}

const sqsClient = new SQSClient({ region: AWS_REGION })

const createResponse = (
  statusCode: number,
  body: object,
): APIGatewayProxyResult => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log('Evento de upload de imagem recebido do API Gateway')

  try {
    const { errors, payload } = validateImageProducerPayload(event.body)

    if (errors.length > 0) {
      console.warn('Requisição de upload inválida:', { errors })
      return createResponse(400, {
        message: 'Dados da requisição são inválidos.',
        errors,
      })
    }

    const command = new SendMessageCommand({
      QueueUrl: IMAGE_QUEUE_URL,
      MessageBody: JSON.stringify(payload),
    })

    console.log('Enviando mensagem de upload para a SQS...')
    await sqsClient.send(command)
    console.log('Mensagem de upload enfileirada com sucesso!')

    return createResponse(202, {
      message: 'Pedido de upload de imagem recebido com sucesso!',
    })
  } catch (error) {
    console.error('Ocorreu um erro inesperado no producer:', error)
    return createResponse(500, {
      message: 'Ocorreu um erro interno inesperado.',
    })
  }
}
