import { Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRegister } from "../hooks";
import type { RegisterInput } from "../types";

type SignUpFields = RegisterInput & { confirmPassword: string };

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none sm:text-sm";

function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutateAsync: registerAccount, isPending } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFields>({
    defaultValues: {
      email: "",
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submit = async ({
    confirmPassword: _confirmPassword,
    ...input
  }: SignUpFields) => {
    void _confirmPassword;
    try {
      await registerAccount({
        ...input,
        name: input.name?.trim() || undefined,
      });
      onSuccess?.();
    } catch {
      // The shared QueryClient displays the API error.
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3.5">
      <div>
        <label
          htmlFor="signup-email"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
          {...register("email", {
            required: "Vui lòng nhập email",
            maxLength: { value: 254, message: "Email quá dài" },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email không hợp lệ",
            },
          })}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-username"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Tên đăng nhập
        </label>
        <input
          id="signup-username"
          type="text"
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          className={inputClass}
          {...register("username", {
            required: "Vui lòng nhập tên đăng nhập",
            pattern: {
              value: /^[A-Za-z0-9_]{3,32}$/,
              message: "Dùng 3–32 ký tự chữ, số hoặc _",
            },
          })}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-name"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Tên hiển thị
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
          {...register("name", {
            maxLength: { value: 100, message: "Tên không được quá 100 ký tự" },
            validate: (value) =>
              !value ||
              value.trim().length > 0 ||
              "Tên không được chỉ có khoảng trắng",
          })}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Mật khẩu
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          className={inputClass}
          {...register("password", {
            required: "Vui lòng nhập mật khẩu",
            minLength: { value: 12, message: "Mật khẩu cần ít nhất 12 ký tự" },
            maxLength: { value: 128, message: "Mật khẩu tối đa 128 ký tự" },
          })}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-confirm"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Nhập lại mật khẩu
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          className={inputClass}
          {...register("confirmPassword", {
            required: "Vui lòng nhập lại mật khẩu",
            validate: (value, values) =>
              value === values.password || "Mật khẩu không khớp",
          })}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:text-sm"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Đăng ký
      </button>
    </form>
  );
}

export default SignUpForm;
