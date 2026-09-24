import { useEffect, useRef, useState, type FormEvent } from 'react'
import './auth.css'

type Mode = 'login' | 'signup'
type Step = 'name' | 'email' | 'password'

export type AuthSubmission = {
  mode: Mode
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export type AuthResult = {
  requiresEmailConfirmation?: boolean
  message?: string
}

type AppProps = {
  initialMode?: Mode
  onModeChange?: (mode: Mode) => void
  onAuthenticate?: (submission: AuthSubmission) => Promise<AuthResult | void> | AuthResult | void
  onCheckPurchase?: (email: string) => Promise<void>
  onComplete?: () => void
}

export default function App({ initialMode = 'login', onModeChange, onAuthenticate, onCheckPurchase, onComplete }: AppProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [step, setStep] = useState<Step>(initialMode === 'signup' ? 'name' : 'email')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [passwordFilled, setPasswordFilled] = useState(false)
  const [confirmPasswordFilled, setConfirmPasswordFilled] = useState(false)
  const [passwordEditable, setPasswordEditable] = useState(false)
  const [confirmPasswordEditable, setConfirmPasswordEditable] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step !== 'password') return undefined

    const removeUnrequestedAutofill = () => {
      if (!passwordEditable && showPassword) setShowPassword(false)

      if (!passwordEditable && passwordRef.current?.value) {
        passwordRef.current.value = ''
        setPasswordFilled(false)
      }

      if (mode === 'signup' && !confirmPasswordEditable && confirmPasswordRef.current?.value) {
        confirmPasswordRef.current.value = ''
        setConfirmPasswordFilled(false)
      }
    }

    removeUnrequestedAutofill()
    const interval = window.setInterval(removeUnrequestedAutofill, 40)
    return () => window.clearInterval(interval)
  }, [confirmPasswordEditable, mode, passwordEditable, showPassword, step])

  const clearSensitiveFields = () => {
    if (passwordRef.current) passwordRef.current.value = ''
    if (confirmPasswordRef.current) confirmPasswordRef.current.value = ''
    setPasswordFilled(false)
    setConfirmPasswordFilled(false)
    setPasswordEditable(false)
    setConfirmPasswordEditable(false)
    setShowPassword(false)
  }

  const returnToEmail = () => {
    clearSensitiveFields()
    setMessage('')
    setStep('email')
  }

  const switchMode = () => {
    const nextMode = mode === 'login' ? 'signup' : 'login'
    clearSensitiveFields()
    setMode(nextMode)
    setStep(nextMode === 'signup' ? 'name' : 'email')
    setMessage('')
    onModeChange?.(nextMode)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    if (mode === 'login' && step === 'email') {
      setEmail((currentEmail) => currentEmail.trim().toLocaleLowerCase('pt-BR'))
      return setStep('password')
    }
    if (mode === 'signup' && step === 'name') return setStep('email')
    if (mode === 'signup' && step === 'email') {
      const purchaseEmail = email.trim().toLowerCase()
      setEmail(purchaseEmail)
      setSubmitting(true)
      try {
        if (!onCheckPurchase) throw new Error('Não foi possível verificar sua compra. Tente novamente mais tarde.')
        await onCheckPurchase(purchaseEmail)
        setStep('password')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Não foi possível verificar sua compra.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    const password = passwordRef.current?.value ?? ''
    const confirmPassword = confirmPasswordRef.current?.value ?? ''
    if (mode === 'signup' && password !== confirmPassword) return setMessage('As senhas não coincidem.')

    setSubmitting(true)
    try {
      const result = await onAuthenticate?.({
        mode,
        email: email.trim().toLocaleLowerCase('pt-BR'),
        password,
        ...(mode === 'signup' ? { firstName: firstName.trim(), lastName: lastName.trim() } : {}),
      })
      clearSensitiveFields()
      if (result?.requiresEmailConfirmation) {
        setMessage(result.message ?? 'Conta criada. Confirme seu e-mail para entrar.')
        return
      }
      onComplete?.()
    } catch (error) {
      clearSensitiveFields()
      setMessage(error instanceof Error ? error.message : 'Não foi possível continuar. Confira seus dados e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'login'
    ? step === 'email' ? 'Faça login' : 'Bem-vindo de volta'
    : step === 'name' ? 'Crie sua conta' : step === 'email' ? 'Qual é seu e-mail?' : 'Crie uma senha'
  const subtitle = mode === 'login'
    ? step === 'password' ? email : 'com sua conta. Essa conta ficará disponível para você utilizar a plataforma completa.'
    : step === 'name' ? 'Insira seu nome' : step === 'email' ? 'Use o mesmo e-mail informado na compra. Vamos verificar seu pagamento antes de continuar.' : 'Continue criando sua conta Prime.'
  const actionLabel = mode === 'login'
    ? step === 'email' ? 'Avançar' : 'Entrar'
    : step === 'password' ? 'Criar conta' : 'Avançar'

  return (
    <main className={`auth-screen${submitting ? ' auth-screen--busy' : ''}`}>
      <div className="auth-shell">
        <form className={`auth-card${submitting ? ' auth-card--busy' : ''}`} method="post" autoComplete={step === 'password' ? 'off' : 'on'} aria-busy={submitting} onSubmit={submit}>
          <span className="auth-brand"><img src="https://ikgilxwdllxyjmufvtqh.supabase.co/storage/v1/object/public/logo/universal.png" alt="Prime" /></span>
          <div className="auth-card__grid">
            <section className="auth-intro">
              <h1>{title}</h1>
              {mode === 'login' && step === 'password' ? <button type="button" className="auth-account auth-email-pill" onClick={returnToEmail}>{email}</button> : <p>{subtitle}</p>}
            </section>
            <section className="auth-form">
              {step === 'password' ? <>
                <label className={`auth-field${passwordFilled ? ' auth-field--filled' : ''}`}><span>Digite sua senha</span><input ref={passwordRef} className="auth-input" name="new-password-entry" type={showPassword ? 'text' : 'password'} placeholder=" " autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" readOnly={!passwordEditable} maxLength={128} minLength={mode === 'signup' ? 8 : undefined} onFocus={(event) => { event.currentTarget.value = ''; event.currentTarget.readOnly = false; setPasswordFilled(false); setPasswordEditable(true) }} onInput={(event) => setPasswordFilled(Boolean(event.currentTarget.value))} required /></label>
                {mode === 'signup' ? <label className={`auth-field${confirmPasswordFilled ? ' auth-field--filled' : ''}`}><span>Confirme sua senha</span><input ref={confirmPasswordRef} className="auth-input" name="new-password-confirmation" type={showPassword ? 'text' : 'password'} placeholder=" " autoComplete="new-password" data-1p-ignore="true" data-lpignore="true" readOnly={!confirmPasswordEditable} maxLength={128} minLength={8} onFocus={(event) => { event.currentTarget.value = ''; event.currentTarget.readOnly = false; setConfirmPasswordFilled(false); setConfirmPasswordEditable(true) }} onInput={(event) => setConfirmPasswordFilled(Boolean(event.currentTarget.value))} required /></label> : null}
                <label className="auth-show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /><span>Mostrar senha</span></label>
              </> : mode === 'signup' && step === 'name' ? <>
                <label className={`auth-field${firstName ? ' auth-field--filled' : ''}`}><span>Nome</span><input className="auth-input" name="given-name" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoFocus required /></label>
                <label className={`auth-field${lastName ? ' auth-field--filled' : ''}`}><span>Sobrenome</span><input className="auth-input" name="family-name" autoComplete="family-name" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} required /></label>
              </> : <>
                <label className={`auth-field${email ? ' auth-field--filled' : ''}`}><span>E-mail</span><input className="auth-input" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                {mode === 'login' ? <p className="auth-helper auth-helper--large">Acabou de comprar e é sua primeira vez na plataforma? Crie sua conta agora para acessar a plataforma completa.</p> : null}
              </>}
              {message ? <div className="auth-error" role="alert">{message}</div> : null}
              <div className="auth-actions">
                <button type="button" className="auth-link" onClick={switchMode} disabled={submitting}>{mode === 'login' ? 'Criar conta' : 'Já tenho uma conta'}</button>
                <button className="auth-next" disabled={submitting}>{actionLabel}</button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </main>
  )
}
