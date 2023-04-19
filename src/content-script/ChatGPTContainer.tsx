import { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ProviderType, TriggerMode } from '../config'
import ChatGPTCard from './ChatGPTCard'
import { QueryStatus } from './ChatGPTQuery'
import Promotion from './Promotion'

interface Props {
  question: string
  triggerMode: TriggerMode
  provider: ProviderType
}

function ChatGPTContainer(props: Props) {
  const [queryStatus, setQueryStatus] = useState<QueryStatus>()
  const query = useSWRImmutable(queryStatus === 'success' ? 'promotion' : undefined, null, {
    shouldRetryOnError: false,
  })
  return (
    <>
      <div className="chat-gpt-card">
        <ChatGPTCard
          question={props.question}
          triggerMode={props.triggerMode}
          provider={props.provider}
          onStatusChange={setQueryStatus}
        />
      </div>
      {query.data && <Promotion data={query.data} />}
    </>
  )
}

export default ChatGPTContainer
