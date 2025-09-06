/**
 * Input Event Debugging Utility
 * Temporary debugging tool to help identify input interaction issues
 */

interface InputEventLog {
  timestamp: number
  eventType: string
  target: string
  blocked: boolean
  details: any
}

class InputEventDebugger {
  private logs: InputEventLog[] = []
  private isEnabled = false

  enable() {
    if (typeof window === 'undefined') return
    
    this.isEnabled = true
    this.logs = []

    // Add event listeners for input-related events
    const events = ['click', 'mousedown', 'mouseup', 'focus', 'blur', 'input', 'change']
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        if (!this.isEnabled) return

        const target = event.target as HTMLElement
        const isInputRelated = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.closest('.MuiTextField-root') !== null ||
                              target.closest('form') !== null

        if (isInputRelated) {
          this.logEvent({
            timestamp: Date.now(),
            eventType,
            target: `${target.tagName}${target.className ? '.' + target.className.replace(/\s+/g, '.') : ''}`,
            blocked: event.defaultPrevented,
            details: {
              isFocusable: target.tabIndex !== undefined,
              isDisabled: (target as any).disabled,
              currentTarget: (event.currentTarget as HTMLElement)?.tagName,
              bubbles: event.bubbles,
              cancelable: event.cancelable
            }
          })
        }
      }, true) // Use capture phase
    })

    console.log('🔍 Input event debugging enabled. Use inputEventDebug.getLogs() to view events.')
  }

  disable() {
    this.isEnabled = false
    console.log('🔍 Input event debugging disabled.')
  }

  private logEvent(log: InputEventLog) {
    this.logs.push(log)
    
    // Keep only last 50 events
    if (this.logs.length > 50) {
      this.logs.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const style = log.blocked ? 'color: red; font-weight: bold;' : 'color: green;'
      console.log(
        `%c[INPUT DEBUG] ${log.eventType} on ${log.target} ${log.blocked ? '(BLOCKED)' : '(OK)'}`,
        style,
        log.details
      )
    }
  }

  getLogs(): InputEventLog[] {
    return [...this.logs]
  }

  getBlockedEvents(): InputEventLog[] {
    return this.logs.filter(log => log.blocked)
  }

  clearLogs() {
    this.logs = []
    console.log('🔍 Input event logs cleared.')
  }

  generateReport(): string {
    const total = this.logs.length
    const blocked = this.getBlockedEvents().length
    const eventTypes = [...new Set(this.logs.map(log => log.eventType))]
    const targets = [...new Set(this.logs.map(log => log.target))]

    return `
INPUT EVENT DEBUG REPORT
========================
Total Events: ${total}
Blocked Events: ${blocked} (${blocked > 0 ? ((blocked/total) * 100).toFixed(1) : 0}%)
Event Types: ${eventTypes.join(', ')}
Targets: ${targets.join(', ')}

${blocked > 0 ? 'BLOCKED EVENTS:\n' + this.getBlockedEvents().map(log => 
  `- ${new Date(log.timestamp).toISOString()} ${log.eventType} on ${log.target}`
).join('\n') : 'No blocked events found ✅'}
    `.trim()
  }
}

// Global instance for debugging
const inputEventDebug = new InputEventDebugger()

// Make available in browser console during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).inputEventDebug = inputEventDebug
}

export default inputEventDebug