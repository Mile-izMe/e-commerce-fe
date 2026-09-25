import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLogin } from "../hooks";
import type { LoginInput } from "../types";

function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutateAsync: login, isPending } = useLogin();

  const form = useForm<LoginInput>({ defaultValues: { identifier: "", password: "" } });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleLogin = async (data: LoginInput) => {
    try {
      await login(data);
      onSuccess?.();
    } catch {
      // The shared QueryClient displays the API error.
    }
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-3.5">
      <div>
        <label htmlFor="signin-identifier" className="block text-xs font-medium text-neutral-700 mb-1">
          Identifier
        </label>
        <div className="relative">
          <input
            id="signin-identifier"
            type="text"
            autoComplete="username"
            aria-invalid={Boolean(errors.identifier)}
            {...register("identifier", {
              required: "Vui lòng nhập email hoặc tên đăng nhập",
            })}
            placeholder="name@domain.com or username"
            className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-950 transition-colors"
          />
          <Mail className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
        </div>
        {errors.identifier && (
          <p className="text-brand-red text-[9px] uppercase font-black tracking-widest mt-1">
            {errors.identifier.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="signin-password" className="block text-xs font-medium text-neutral-700">
            Mật khẩu
          </label>
        </div>
        <div className="relative">
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
            })}
            placeholder="••••••••"
            className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-950 transition-colors"
          />
          <Lock className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
        </div>
        {errors.password && (
          <p className="text-brand-red text-[9px] uppercase font-black tracking-widest mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit CTA */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 px-6 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SignInForm;
