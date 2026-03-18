import { LoginForm } from '@/features/auth/components/LoginForm'
import logoUrl from '../../../../src-tauri/icons/128x128.png'

export function LoginPage() {
  return (
    <main className="flex min-h-screen bg-white">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex w-[520px] flex-col justify-between bg-gradient-to-b from-[#4F46E5] to-[#7C3AED] p-16">
        {/* Logo区 */}
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-xl" />
          <span className="font-sans text-2xl font-bold text-white">
            AI 自动化办公
          </span>
        </div>

        {/* Slogan区 */}
        <div className="flex flex-col gap-6">
          <h1 className="font-sans text-[48px] font-bold leading-[1.2] text-white whitespace-pre-line">
            {'开启高效\n工作新时代'}
          </h1>
          <p className="font-sans text-lg leading-[1.5] text-indigo-100">
            智能化的自动化办公助手，助您轻松应对复杂任务，提升十倍工作效率。
          </p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex flex-1 items-center justify-center p-8 sm:p-16">
        <LoginForm />
      </div>
    </main>
  )
}
