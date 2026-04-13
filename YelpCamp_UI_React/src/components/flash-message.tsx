import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useFlashStore } from '@/stores/flash-store'

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const styleMap = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

export function FlashMessage() {
  const messages = useFlashStore((s) => s.messages)
  const remove = useFlashStore((s) => s.remove)

  if (messages.length === 0) return null

  return (
    <div className="container mx-auto px-4 pt-4">
      <div className="flex flex-col gap-2">
        {messages.map((msg) => {
          const Icon = iconMap[msg.type]
          return (
            <Alert key={msg.id} className={cn(styleMap[msg.type])}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <AlertDescription className="flex-1">{msg.message}</AlertDescription>
                <button
                  type="button"
                  onClick={() => remove(msg.id)}
                  className="shrink-0 opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Alert>
          )
        })}
      </div>
    </div>
  )
}
