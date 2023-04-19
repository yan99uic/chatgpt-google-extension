import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class OpenAIProvider implements Provider {
  constructor(private endpoint: string, private token: string, private model: string) {
    this.endpoint = endpoint
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): string {
    if (this.model.startsWith('text-chat-davinci')) {
      return `Respond conversationally.<|im_end|>\n\nUser: ${prompt}<|im_sep|>\nChatGPT:`
    }
    return prompt
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    let endpoint = this.endpoint + '/v1/completions'
    const headers: [string, string][] = [['Content-Type', 'application/json']]
    if (this.endpoint.includes('.azure.com')) {
      endpoint =
        this.endpoint + '/openai/deployments/' + this.model + '/completions?api-version=2022-12-01'
      headers.push(['api-key', this.token])
    } else {
      headers.push(['Authorization', `Bearer ${this.token}`])
    }
    await fetchSSE(endpoint, {
      method: 'POST',
      signal: params.signal,
      headers: headers,
      body: JSON.stringify({
        prompt: this.buildPrompt(params.prompt),
        stream: true,
        max_tokens: 2048,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(message)
          const text = data.choices[0].text
          if (text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
